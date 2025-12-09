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
  AuditLogEvent,
  Partials
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
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [Partials.Message, Partials.Channel]
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

     const call = client.channels.cache.get(CALL_24H);
if (call) {
  joinVoiceChannel({
    channelId: call.id,
    guildId: call.guild.id,
    adapterCreator: call.guild.voiceAdapterCreator,
    selfDeaf: false
  });

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

// ====================== SERVIDOR PERMITIDO ======================
client.on("guildCreate", guild => {
  if (guild.id !== SERVIDOR_PERMITIDO) {
    console.log(`❌ Servidor não autorizado: ${guild.name} — Saindo...`);
    guild.leave();
  }
});


// =========================
// IDS .ENV
// =========================

const LOG_MSG = process.env.LOG_MENSAGENS;
const LOG_EDIT = process.env.LOG_MENSAGENS;
const LOG_DELETE = process.env.LOG_MENSAGENS;
const LOG_VOICE = process.env.LOG_VOZ;
const LOG_ROLE = process.env.LOG_CARGOS;


// =========================
// OBJETO PADRÃO (ESTILO DA IMAGEM)
// =========================

function cardFormat(title, user, channel, content, color = "#2f3136") {
  return {
    embeds: [
      new EmbedBuilder()
        .setTitle(title)
        .setColor(color)
        .addFields(
          {
            name: "👤 Autor",
            value: `${user} (\`${user.id}\`)`
          },
          channel ? {
            name: "📌 Canal",
            value: `${channel}`
          } : null,
          {
            name: "💬 Conteúdo",
            value: content
          }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp()
    ]
  }
}


// =========================
// NOVA MENSAGEM
// =========================

client.on("messageCreate", async msg => {
  if (msg.author.bot) return;
  
  const canal = client.channels.cache.get(LOG_MSG);
  if (!canal) return;

  canal.send(cardFormat(
    "📝 Nova mensagem",
    msg.author,
    `<#${msg.channel.id}>`,
    msg.content || "(sem conteúdo)"
  ));
});


// =========================
// MSG EDITADA
// =========================

client.on("messageUpdate", async (oldMsg, newMsg) => {
  if (!newMsg || !oldMsg) return;
  if (newMsg.author.bot) return;
  if (oldMsg.content === newMsg.content) return;

  const canal = client.channels.cache.get(LOG_EDIT);
  if (!canal) return;

  canal.send(cardFormat(
    "✏ Mensagem editada",
    newMsg.author,
    `<#${newMsg.channel.id}>`,
    `✒ **Antes:**\n${oldMsg.content}\n\n🆕 **Depois:**\n${newMsg.content}`
  ));
});


// =========================
// MSG APAGADA
// =========================

client.on("messageDelete", async msg => {
  if (!msg) return;

  const canal = client.channels.cache.get(LOG_DELETE);
  if (!canal) return;

  canal.send(cardFormat(
    "🗑 Mensagem deletada",
    msg.author,
    `<#${msg.channel.id}>`,
    msg.content || "(sem conteúdo)"
  ));
});


// =========================
// VOICE
// =========================

client.on("voiceStateUpdate", (oldState, newState) => {
  const canal = client.channels.cache.get(LOG_VOICE);
  if (!canal) return;

  const member = newState.member || oldState.member;
  let action, text;

  if (!oldState.channel && newState.channel) {
    action = "🎧 Entrou no canal";
    text = newState.channel.name;
  }
  else if (oldState.channel && !newState.channel) {
    action = "📤 Saiu do canal";
    text = oldState.channel.name;
  }
  else if (oldState.channel?.id !== newState.channel?.id) {
    action = "🔃 Moveu de canal";
    text = `${oldState.channel.name} ➝ ${newState.channel.name}`;
  }
  else return;

  canal.send(cardFormat(
    action,
    member.user,
    null,
    `\`\`\`${text}\`\`\``
  ));
});


// =========================
// CARGOS
// =========================

client.on("guildMemberUpdate", (oldMember, newMember) => {
  const canal = client.channels.cache.get(LOG_ROLE);
  if (!canal) return;

  const oldRoles = oldMember.roles.cache.map(r => r.id);
  const newRoles = newMember.roles.cache.map(r => r.id);

  const added = newRoles.find(r => !oldRoles.includes(r));
  const removed = oldRoles.find(r => !newRoles.includes(r));

  if (added) {
    canal.send(cardFormat(
      "➕ Cargo adicionado",
      newMember.user,
      null,
      `<@&${added}>`,
      "#43b581"
    ));
  }

  if (removed) {
    canal.send(cardFormat(
      "➖ Cargo removido",
      newMember.user,
      null,
      `<@&${removed}>`,
      "#faa61a"
    ));
  }
});


// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);
