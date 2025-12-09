// ====================== KEEP ALIVE ======================
const express = require("express");
const app = express();
app.get("/", (req, res) => res.send("Bot ativo e rodando 24h! 🚀"));
app.listen(3000, () => console.log("🌐 KeepAlive ativo na porta 3000!"));

// ====================== DOTENV ==========================
require("dotenv").config();

// ====================== DISCORD.JS ======================
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events,
  AuditLogEvent
} = require("discord.js");

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource
} = require("@discordjs/voice");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ====================== VARIÁVEIS .ENV ==================
const {
  CANAL_PEDIR_SET,
  CANAL_ACEITA_SET,
  CARGO_APROVADO,
  CARGO_APROVADO_2,
  TOKEN,
  CALL_24H,
  LOG_MENSAGENS,
  LOG_VOZ,
  LOG_CARGOS,
  SERVIDOR_PERMITIDO
} = process.env;

// ====================== BOT ONLINE ======================
client.once("ready", async () => {
  console.log(`🤖 Bot ligado como ${client.user.tag}`);

  const canal = await client.channels.fetch(CANAL_PEDIR_SET);

  const embed = new EmbedBuilder()
    .setTitle("Sistema Família Do7")
    .setDescription("Registro A7.\n\n Solicite SET usando o botão abaixo.\nPreencha com atenção!")
    .addFields({
      name: "📌 Lembretes",
      value: "• A resenha aqui é garantida.\n• Não leve tudo a sério."
    })
    .setColor("#f1c40f");

  const btn = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrirRegistro")
      .setLabel("Registro")
      .setStyle(ButtonStyle.Primary)
  );

  await canal.send({ embeds: [embed], components: [btn] });

  // Conectar ao canal 24h
  try {
    const call = client.channels.cache.get(CALL_24H);
    if (call) {
      const connection = joinVoiceChannel({
        channelId: call.id,
        guildId: call.guild.id,
        adapterCreator: call.guild.voiceAdapterCreator,
        selfDeaf: false
      });

      const player = createAudioPlayer();
      const resource = createAudioResource("silencio.mp3"); 
      player.play(resource);
      connection.subscribe(player);

      console.log("🔊 Bot conectado na call 24h!");
    }
  } catch (err) {
    console.log("Erro ao conectar no VC:", err);
  }

  console.log("📩 Sistema carregado com sucesso!");
});

// ====================== ABRIR MODAL ======================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;
  if (interaction.customId !== "abrirRegistro") return;

  const modal = new ModalBuilder()
    .setCustomId("modalRegistro")
    .setTitle("Solicitação de Set");

  const nome = new TextInputBuilder()
    .setCustomId("nome")
    .setLabel("Seu nome*")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  const id = new TextInputBuilder()
    .setCustomId("iduser")
    .setLabel("Seu ID *")
    .setRequired(true)
    .setStyle(TextInputStyle.Short);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nome),
    new ActionRowBuilder().addComponents(id)
  );

  await interaction.showModal(modal);
});

// ====================== RECEBER FORM ======================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  if (interaction.customId !== "modalRegistro") return;

  const nome = interaction.fields.getTextInputValue("nome");
  const iduser = interaction.fields.getTextInputValue("iduser");

  const canal = await client.channels.fetch(CANAL_ACEITA_SET);

  const embed = new EmbedBuilder()
    .setTitle("Novo Pedido de Registro")
    .setColor("#3498db")
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: "Usuário", value: `${interaction.user}` },
      { name: "Nome Informado", value: nome },
      { name: "ID Informado", value: iduser },
      {
        name: "Conta Criada em",
        value: `<t:${Math.floor(interaction.user.createdTimestamp / 1000)}:R>`
      }
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`aprovar_${interaction.user.id}`)
      .setLabel("Aprovar")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`negar_${interaction.user.id}`)
      .setLabel("Negar")
      .setStyle(ButtonStyle.Danger)
  );

  await canal.send({ embeds: [embed], components: [row] });

  await interaction.reply({
    content: "Seu pedido foi enviado!",
    ephemeral: true,
  });
});

// =================== APROVAR / NEGAR ===================
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  const [acao, userId] = interaction.customId.split("_");
  if (!["aprovar", "negar"].includes(acao)) return;

  const membro = await interaction.guild.members.fetch(userId);
  const embedOriginal = interaction.message.embeds[0];

  const nomeInformado = embedOriginal.fields.find(f => f.name === "Nome Informado")?.value;
  const idInformado = embedOriginal.fields.find(f => f.name === "ID Informado")?.value;

  if (acao === "aprovar") {
    try {
      await membro.setNickname(`A7 ${nomeInformado}`);

      await membro.roles.add([
        CARGO_APROVADO,
        CARGO_APROVADO_2,
      ]);

      await membro.send(`
<a:coroa4:1425236745762504768> **Seja Muito Bem-vindo à Family Do7 ** <:emojia7:1429141492080967730>

✨ **Seu set foi aceito!**  
A vibe aqui é única. Aproveite o movimento!  
      `).catch(() => { });

      const embedAprovado = new EmbedBuilder()
        .setColor("Green")
        .setTitle("Registro Aprovado")
        .addFields(
          { name: "👤 Usuário:", value: `${membro}` },
          { name: "🪪 ID:", value: `${idInformado}` },
          { name: "📛 Nome Informado:", value: `A7 ${nomeInformado}` },
          { name: "🧭 Acesso aprovado por:", value: `${interaction.user}` }
        )
        .setThumbnail(membro.user.displayAvatarURL());

      await interaction.update({
        embeds: [embedAprovado],
        components: []
      });

    } catch (e) {
      console.log(e);
      return interaction.reply({
        content: "❌ Erro ao aprovar. Verifique permissões.",
        ephemeral: true
      });
    }
  }

  if (acao === "negar") {
    try {
      await membro.kick("Registro negado pelo aprovador.");

      const embedNegado = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Registro Negado")
        .setDescription(`❌ O usuário **${membro.user.tag}** foi expulso.\nNegado por: ${interaction.user}`)
        .setThumbnail(membro.user.displayAvatarURL());

      await interaction.update({
        embeds: [embedNegado],
        components: []
      });

    } catch (e) {
      console.log(e);
      return interaction.reply({
        content: "❌ Não consegui expulsar o usuário.",
        ephemeral: true
      });
    }
  }
});

// =================== PV PARA TODOS ===================
client.on("messageCreate", async (message) => {
  if (!message.content.startsWith("!pvall")) return;
  if (!message.member.permissions.has("Administrator"))
    return message.reply("❌ Você não tem permissão para usar este comando!");

  const texto = message.content.split(" ").slice(1).join(" ");
  if (!texto) return message.reply("⚠️ Escreva uma mensagem para enviar!");

  const members = await message.guild.members.fetch();

  message.reply(`📨 Enviando mensagem para **${members.size} membros**...`);

  let enviados = 0;
  let falhou = 0;

  members.forEach(m => {
    if (m.user.bot) return;

    m.send(`📩 **Familia A7 :**\n${texto}`)
      .then(() => enviados++)
      .catch(() => falhou++);
  });

  setTimeout(() => {
    message.channel.send(
      `✔️ Enviado para **${enviados}** membros.\n⚠️ Falhou para **${falhou}** (DM fechada).`
    );
  }, 5000);
});

// =================== LOGS ===================
client.on(Events.MessageCreate, async msg => {
  if (msg.author.bot) return;
  let canal = client.channels.cache.get(LOG_MENSAGENS);

  canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#00ff99")
        .setTitle("📝 Nova mensagem")
        .addFields(
          { name: "👤 Autor", value: `${msg.author}` },
          { name: "📍 Canal", value: `${msg.channel}` },
          { name: "💬 Conteúdo", value: `\`\`\`${msg.content}\`\`\`` }
        )
        .setTimestamp()
    ]
  });
});

client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
  if (!oldMsg.content || !newMsg.content) return;

  client.channels.cache.get(LOG_MENSAGENS).send({
    embeds: [
      new EmbedBuilder()
        .setColor("#ffcc00")
        .setTitle("✏ Mensagem Editada")
        .addFields(
          { name: "👤 Autor", value: `${oldMsg.author}` },
          { name: "Antes", value: `\`\`\`${oldMsg.content}\`\`\`` },
          { name: "Depois", value: `\`\`\`${newMsg.content}\`\`\`` }
        )
        .setTimestamp()
    ]
  });
});

client.on(Events.MessageDelete, async msg => {
  if (!msg.content) return;

  client.channels.cache.get(LOG_MENSAGENS).send({
    embeds: [
      new EmbedBuilder()
        .setColor("Red")
        .setTitle("🗑 Mensagem Apagada")
        .addFields(
          { name: "👤 Autor", value: `${msg.author}` },
          { name: "Conteúdo", value: `\`\`\`${msg.content}\`\`\`` }
        )
        .setTimestamp()
    ]
  });
});

// Detectar SPAM
const msgCount = {};
client.on(Events.MessageCreate, msg => {
  if (msg.author.bot) return;
  if (!msgCount[msg.author.id]) msgCount[msg.author.id] = 0;

  msgCount[msg.author.id]++;

  setTimeout(() => msgCount[msg.author.id]--, 5000);

  if (msgCount[msg.author.id] >= 6) {
    client.channels.cache.get(LOG_MENSAGENS).send(
      `⚠ **Possível SPAM detectado!**  
👤 Usuário: ${msg.author}  
Canal: ${msg.channel}`
    );
  }
});

// LOG DE CALL
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  let canal = client.channels.cache.get(LOG_VOZ);

  if (!oldState.channel && newState.channel)
    canal.send(`🟢 **${newState.member.user.username} entrou** em 📞 ${newState.channel.name}`);

  if (oldState.channel && !newState.channel)
    canal.send(`🔴 **${newState.member.user.username} saiu** da call`);

  if (oldState.channelId !== newState.channelId && oldState.channel && newState.channel)
    canal.send(`🔁 **${newState.member.user.username} foi movido** \`${oldState.channel.name} → ${newState.channel.name}\``);
});

// LOGS DE CARGOS
client.on(Events.GuildMemberUpdate, (oldM, newM) => {
  let canal = client.channels.cache.get(LOG_CARGOS);

  const removido = oldM.roles.cache.filter(r => !newM.roles.cache.has(r.id));
  const adicionado = newM.roles.cache.filter(r => !oldM.roles.cache.has(r.id));

  removido.forEach(role => canal.send(`🔻 Cargo removido de ${newM.user}: **${role.name}**`));
  adicionado.forEach(role => canal.send(`🔺 Cargo adicionado ao ${newM.user}: **${role.name}**`));
});

client.on(Events.GuildRoleCreate, role => {
  client.channels.cache.get(LOG_CARGOS).send(`🆕 Cargo **${role.name}** foi criado`);
});
client.on(Events.GuildRoleDelete, role => {
  client.channels.cache.get(LOG_CARGOS).send(`❌ Cargo **${role.name}** foi deletado`);
});

// ====================== SERVIDOR PERMITIDO ======================
client.on("guildCreate", guild => {
  if (guild.id !== SERVIDOR_PERMITIDO) {
    console.log(`❌ Servidor não autorizado: ${guild.name} — Saindo...`);
    guild.leave();
  }
});

// ====================== LOGIN ======================
client.login(TOKEN);