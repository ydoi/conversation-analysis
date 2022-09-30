const { WebClient } = require('@slack/web-api');

(async () => {
  const token  = '';
  const client = new WebClient(token);
  const channel_list = await client.conversations.list({exclude_archived: true});
  const user_list = await client.users.list();
  const not_bot_users = user_list.members.filter(m => !m.deleted && !m.is_bot);
  const today_user_index =  Math.floor(Math.random() * not_bot_users.length);
  const today_user = not_bot_users[today_user_index];

  const date = new Date();
  const oldest = Math.floor(date.setDate(date.getDate() - 7)/1000);

  const reaction_count = {};
  const most_reaction_message = {
    channel: "",
    user: "",
    text: "",
    count: 0,
    ts: 0,
    reactions: null,
  }
  today_user_count = {};
  for (const channel of channel_list.channels) {
    // if (channel.id != 'C6YUSQCK1') continue;
    // チャンネルの履歴
    const response = await client.conversations.history({channel: channel.id, oldest});
    // リアクションされているメッセージのみ
    const messages_with_reaction = response.messages.filter(message => 'reactions' in message);
    for (const message of messages_with_reaction) {
      // もっともリアクションされている絵文字の種類が多いメッセージを更新
      if (message.reactions.length > most_reaction_message.count) {
        most_reaction_message.channel = channel;
        most_reaction_message.user = message.user;
        most_reaction_message.text = message.text;
        most_reaction_message.count = message.reactions.length;
        most_reaction_message.ts = message.ts.replace('.', '');
        most_reaction_message.reactions = message.reactions;
      }

      for (const reaction of message.reactions) {
        // 今日のユーザーのリアクションをカウント
        if (reaction.users.includes(today_user.id)) {
          if (reaction.name in today_user_count) {
            today_user_count[reaction.name] += 1;
          } else {
            today_user_count[reaction.name] = 1;
          }
        }
        // リアクションの利用回数をカウント
        if (reaction.name in reaction_count) {
          reaction_count[reaction.name] = reaction_count[reaction.name] + reaction.count;
        } else {
          reaction_count[reaction.name] = 1;
        }
      }
    }
  }
  const sorted = Object.entries(reaction_count).sort((p, q) => {
    const pv = p[1];
    const qv = q[1];
    return qv - pv;
  });
  const sorted_today_user_count = Object.entries(today_user_count).sort((p, q) => {
    const pv = p[1];
    const qv = q[1];
    return qv - pv;
  });
  console.log(today_user_count);
  console.log(sorted_today_user_count);
  const user = await client.users.info({user: most_reaction_message.user});
  let postMessage = `先週の絵文字ランキング\n\n第1位: :${sorted[0][0]}: ${sorted[0][1]}回\n第2位: :${sorted[1][0]}: ${sorted[1][1]}回\n第3位: :${sorted[2][0]}: ${sorted[2][1]}回`

  postMessage += `\n\n最もリアクションの多かった投稿は :${user.user.profile.display_name}: の\n\n「${most_reaction_message.text}」でした。\n ${most_reaction_message.reactions.map(reaction => `:${reaction.name}: ${reaction.count}`).join(" ")}  \nhttps://mmmcorp.slack.com/archives/${most_reaction_message.channel.id}/p${most_reaction_message.ts}`;

  if (sorted_today_user_count[0]) {
   postMessage += `\n\n:${today_user.profile.display_name}: が最も利用したリアクションは :${sorted_today_user_count[0][0]}: (${sorted_today_user_count[0][1]}回)でした。`;
  }
  console.log(postMessage);
 //const response = await client.chat.postMessage({ channel: 'C040Z6R60', text: postMessage });
 const response = await client.chat.postMessage({ channel: 'U6X6UN108', text: postMessage });
})();
