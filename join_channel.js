const { WebClient } = require('@slack/web-api');

(async () => {
  const token  = '';
  const client = new WebClient(token);
  const channel_list = await client.conversations.list({exclude_archived: true});

  for (const channel of channel_list.channels) {
    await client.conversations.join({channel: channel.id});
  }
})();
