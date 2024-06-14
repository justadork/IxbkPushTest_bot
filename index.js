const TelegramBot = require('node-telegram-bot-api');
const schedule = require('node-schedule');

const request = require('request');
const util = require('util');
const requestPromise = util.promisify(request);

const { createServer, regex } = require('./httpServer')

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
  try {
    await requestPromise({
      method: 'POST',
      url: wxPusherApi,
      body: JSON.stringify(msg),
      headers: { 'content-type': 'application/json' }
    })
  } catch (e) {
    console.log(e, 'sendWxPusherMsg,e----->');
  }
}

const rule = new schedule.RecurrenceRule();
rule.second = Array.from({ length: 12 }, (_, i) => (i) * 5); // 每隔 5 秒执行一次
//rule.second = Array.from({ length: 6 }, (_, i) => (i) * 10); // 每隔 10 秒执行一次

let job;
const func = async () => {
  try {
    const res = await callApi()
    if (res.code === 200) {
      execCount()
      const temp = transformList(JSON.parse(res.res))
      //await Promise.all(temp.map(t => sendBotMsg(t.telegram)))
      await Promise.all(temp.map(t => sendWxPusherMsg(t.wxPusher)))
    } else {
      job && job.cancel()
    }
  } catch (e) {
    console.log(e, 'func,e----->');
  }
}

const run = async (auto) => {
  await createServer({})
  if (auto) func()
  else {
    job = schedule.scheduleJob(rule, async () => {
      func()
    });
  }
}

const existingList = new Set();
const existingMaxSize = 500;
const deleteHead100List = () => [...existingList].slice(0, 100).map(e => existingList.delete(e))

const transformList = (list) => {
  const contentRegex = new RegExp(regex.content)
  const catenameRegex = new RegExp(regex.catename)
  let res = []
  if (Array.isArray(list)) {
    res = list.filter(item => {
      if (!existingList.has(item.id)) {
        existingList.add(item.id);
        return contentRegex.test(item.content + item.title) || catenameRegex.test(item.catename)
      } else {
        return false
      }
    })

    if (existingList.size >= existingMaxSize) {
      deleteHead100List()
    }
  }
  return res.map(processCardMsg).filter(Boolean)
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
  if (isNaN(item.id)) return ''
  return transformMsg(item)
}

const execCount = (() => {
  let count = 0
  return () => {
    console.log(count++, regex, 'count++----->');
  }
})();

run(false)
