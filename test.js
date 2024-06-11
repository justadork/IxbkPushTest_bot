const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');

const request = require('request');
const util = require('util');
const requestPromise = util.promisify(request);


const chatId = 743901715
const groupId = -4277662891
const token = '7442394491:AAHuB8di2zowkci3XMUOFk6Jzm8fzQ609yU';
/* const bot = new TelegramBot(token, {
  polling: true
}); */

const wxPusherApi = 'https://wxpusher.zjiecode.com/api/send/message'
const appToken = 'AT_AnbBrPzNFObUr92643qTl2vusS5SNSXW'
const wxUid = 'UID_qFgF6BNevF4w5QGzV3OLOxB6C44C'


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
const sendWxPusherMsg = async (msg) => {
  await requestPromise({
    method: 'POST',
    url: wxPusherApi,
    body: JSON.stringify(msg),
    headers: { 'content-type': 'application/json' }
  })
}


const rule = new schedule.RecurrenceRule();
rule.second = Array.from({ length: 12 }, (_, i) => (i) * 5); // 每隔 5 秒执行一次

const func = async () => {
  try {
    const res = await callApi()
    if (res.code === 200) {
      execCount()
      const temp = transformList(JSON.parse(res.res))
      //await Promise.all(temp.map(t => sendBotMsg(t.telegram)))
      await Promise.all(temp.map(t => sendWxPusherMsg(t.wxPusher)))
    } else {
      schedule.cancel()
    }
  } catch (e) {
    console.log(e, 'e----->');
  }
}
const run = (auto) => {
  if (auto) func()
  else {
    schedule.scheduleJob(rule, async () => {
      func()
    });
  }
}

const transformList = (list) => {
  const regex = /镜|依视路|酱/
  let res = []
  if (Array.isArray(list)) {
    res = list.filter(item => regex.test(item.content + item.title))
    res = list
  }
  return res.map(processCardMsg).filter(Boolean).slice(0, 1)
}

const transformMsg = (item) => {
  const { content, title, datetime, shorttime, url, catename } = item
  const telegramCardBase = `时间: ${datetime}${shorttime}
  url: http://new.xianbao.fun/${url}
  标题: ${title}
  内容: ${content}
  分类: ${catename}
  `
  const wxPusherCardBase = {
    appToken: appToken,//必传
    content: `
      <h4>${title}</h4>
      <p>内容:${content}</p></br>
      <p>分类: ${catename}</p>
    `,//必传
    //消息摘要，显示在微信聊天页面或者模版消息卡片上，限制长度20(微信只能显示20)，可以不传，不传默认截取content前面的内容。
    summary: title,
    //内容类型 1表示文字  2表示html(只发送body标签内部的数据即可，不包括body标签，推荐使用这种) 3表示markdown 
    contentType: 2,
    uids: [wxUid],
    //原文链接，可选参数
    url: ` http://new.xianbao.fun/${url}`,
    verifyPay: false,
    verifyPayType: 0
  }
  return {
    telegram: telegramCardBase,
    wxPusher: wxPusherCardBase
  }
}
const processCardMsg = item => {
  if (isNaN(item.cateid)) return ''
  return transformMsg(item)
}

let time = 0
const execCount = () => {
  console.log(time++, 'time++----->');
}

run(false)
