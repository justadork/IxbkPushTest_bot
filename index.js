const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');

const request = require('request');
const util = require('util');
const requestPromise = util.promisify(request);


const chatId = 743901715
const groupId = -4277662891
const token = '7442394491:AAHuB8di2zowkci3XMUOFk6Jzm8fzQ609yU';
const bot = new TelegramBot(token, {
  polling: true
});


const baseApi = 'http://new.xianbao.fun/plus/json/push.json?230406'
const callApi = async () => {
  try {
    const res = await requestPromise(baseApi)
    return { code: 200, res: res.body }
  } catch (e) {
    return { code: 400, err: e }
  }
}
const sendBotMsg = async (msg) => {
  await bot.sendMessage(groupId, msg, {
    parse_mode: 'Markdown'
  });
}

const rule = new schedule.RecurrenceRule();
rule.minute = Array.from({ length: 12 }, (_, i) => (i) * 5); // 每隔 10 秒执行一次
schedule.scheduleJob(rule, async () => {
  try {
    const res = await callApi()
    if (res.code === 200) {
      execCount()
      const temp = transformList(JSON.parse(res.res))
      await Promise.all(temp.map(t => sendBotMsg(t)))
    } else {
      schedule.cancel()
    }
  } catch (e) {
    console.log(e, 'e----->');
  }
});

const transformList = (list) => {
  const regex = /镜|依视路/
  let res = []
  if (Array.isArray(list)) {
    res = list.filter(item => regex.test(item.content + item.title))
  }
  return res.map(processCardMsg).filter(Boolean)
}
const processCardMsg = item => {
  const { cateid, content, title, datetime, shorttime, url } = item
  if (isNaN(cateid)) return ''
  return `时间: ${datetime}${shorttime}
  url: http://new.xianbao.fun/${url}
  标题: ${title}
  内容: ${content}
  `
}

let time = 0
const execCount = () => {
  console.log(time++, 'time++----->');
}
