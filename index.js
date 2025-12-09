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

const { Client, GatewayIntentBits, EmbedBuilder, Partials } = require("discord.js");
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates
    ],
    partials: [Partials.Message, Partials.Channel]
});

// ====================== SERVIDOR PERMITIDO ======================
client.on("guildCreate", guild => {
  if (guild.id !== SERVIDOR_PERMITIDO) {
    console.log(`❌ Servidor não autorizado: ${guild.name} — Saindo...`);
    guild.leave();
  }
});
// ====================== LOGS AUTOMÁTICOS ============================
const {
  EmbedBuilder,
  AuditLogEvent
} = require("discord.js");

// ====== COLOQUE AQUI O ID DOS CANAIS ======
const LOG_MSG = process.env.LOG_MENSAGENS;
const LOG_CALL = process.env.LOG_VOZ;
const LOG_ROLES = process.env.LOG_CARGOS;


// ========= MENSAGEM ENVIADA ==========
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const canal = client.channels.cache.get(LOG_MSG);

  canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#ffd000")
        .setTitle("📩 Mensagem enviada")
        .setDescription(
          `**Autor:** ${message.author}\n` +
          `**Canal:** ${message.channel}\n\n` +
          `**Conteúdo:**\n${message.content}`
        )
        .setTimestamp()
    ]
  });
});


// ========= MENSAGEM EDITADA ==========
client.on("messageUpdate", async (oldMsg, newMsg) => {
  if (!oldMsg.content || !newMsg.content) return;
  if (newMsg.author.bot) return;

  const canal = client.channels.cache.get(LOG_MSG);

  canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#00c8ff")
        .setTitle("✏ Mensagem editada")
        .addFields(
          { name: "Autor", value: `${newMsg.author}`, inline: false },
          { name: "Antes", value: oldMsg.content, inline: false },
          { name: "Depois", value: newMsg.content, inline: false },
        )
        .setTimestamp()
    ]
  });
});


// ========= MENSAGEM DELETADA (quem deletou) ==========
client.on("messageDelete", async (message) => {
  const canal = client.channels.cache.get(LOG_MSG);

  let executor = "autor deletou ou não foi possível identificar";

  try {
    const logs = await message.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MessageDelete,
    });

    const log = logs.entries.first();
    if (log) executor = log.executor;
  } catch {}

  canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("🗑 Mensagem deletada")
        .setDescription(
          `**Autor da mensagem:** ${message.author}\n` +
          `**Deletado por:** ${executor}\n\n` +
          `**Conteúdo:**\n${message.content || "*Mensagem embed ou sem conteúdo*"}`
        )
        .setTimestamp()
    ]
  });
});


// ========= LOG CALL ==========
client.on("voiceStateUpdate", (oldS, newS) => {
  const user = newS.member;
  const canal = client.channels.cache.get(LOG_CALL);

  let texto = "";

  if (!oldS.channel && newS.channel)
    texto = `🔊 Entrou em **${newS.channel.name}**`;

  else if (oldS.channel && !newS.channel)
    texto = `📴 Saiu de **${oldS.channel.name}**`;

  else if (oldS.channelId !== newS.channelId && oldS.channel && newS.channel)
    texto = `➡ Moveu: **${oldS.channel.name}** → **${newS.channel.name}**`;

  else if (oldS.selfMute !== newS.selfMute)
    texto = newS.selfMute ? "🔇 Mutou o próprio microfone" : "🔊 Desmutou";

  else if (oldS.selfDeaf !== newS.selfDeaf)
    texto = newS.selfDeaf ? "🙉 Desligou áudio" : "🎧 Ligou áudio";

  if (!texto) return;

  canal.send({
    embeds: [
      new EmbedBuilder()
        .setColor("#00ff9d")
        .setTitle("🎧 Log de Call")
        .setDescription(`**Usuário:** ${user}\n${texto}`)
        .setTimestamp()
    ]
  });
});


// ========= LOG CARGO (add/remove) ==========
client.on("guildMemberUpdate", (oldM, newM) => {
  const canal = client.channels.cache.get(LOG_ROLES);

  const add = newM.roles.cache.filter(r => !oldM.roles.cache.has(r.id));
  const rem = oldM.roles.cache.filter(r => !newM.roles.cache.has(r.id));

  add.forEach(role => {
    canal.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🟢 Cargo adicionado")
          .setDescription(`**Usuário:** ${newM}\n**Cargo:** ${role}`)
          .setTimestamp()
      ]
    });
  });

  rem.forEach(role => {
    canal.send({
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("🔴 Cargo removido")
          .setDescription(`**Usuário:** ${newM}\n**Cargo:** ${role}`)
          .setTimestamp()
      ]
    });
  });
});

// ====================== LOGIN ======================
client.login(TOKEN);
