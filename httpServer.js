const http = require('http');

const regex = {
  content: '镜|依视路|酱|牛奶|粽子',
  catename: ''
};

const headers = { 'Content-Type': 'application/json' };

const setResponseHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
};

const handleOptionsRequest = (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }
  return false;
};

const handleGetRequest = (url, res, key) => {
  if (url.pathname === `/get-${key}`) {
    res.writeHead(200, { ...headers });
    res.end(JSON.stringify({ [key]: regex[key] }));
    return true;
  }
  return false;
};

const handleSetRequest = (url, res, key) => {
  if (url.pathname === `/set-${key}`) {
    const value = url.searchParams.get(key);
    if (value) {
      regex[key] = value;
      res.writeHead(200, { ...headers });
      res.end(JSON.stringify({ success: true, [key]: regex[key] }));
    } else {
      res.writeHead(400, { ...headers });
      res.end(JSON.stringify({ success: false, message: `${key} query parameter is required` }));
    }
    return true;
  }
  return false;
};

const serverCallback = (req, res) => {
  // 解析 URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  console.log(`http://${req.headers.host}`);

  // 设置 CORS 头部
  setResponseHeaders(res);

  // 处理预检请求
  if (handleOptionsRequest(req, res)) return;

  // 处理 GET 请求
  if (req.method === 'GET') {
    const keys = ['content', 'catename'];
    for (const key of keys) {
      if (handleGetRequest(url, res, key)) return;
      if (handleSetRequest(url, res, key)) return;
    }
  }

  // 处理404
  res.writeHead(404, { ...headers });
  res.end(JSON.stringify({ success: false, message: 'Not Found' }));
};


async function createServer({ port = 9527 }) {
  const server = http.createServer(serverCallback)

  return new Promise((resolve, reject) => {
    server.on('error', (e) => {
      if (e.code === 'EADDRINUSE') {
        console.log(`port ${port} is in use, trying another one...`)
        setTimeout(() => {
          server.close()
          server.listen(++port)
        }, 100)
      } else {
        console.error(e)
        reject(e)
      }
    })

    server.on('listening', () => {
      console.log(`Server running at http://localhost:${port}/`);
      resolve(server)
    })

    server.listen(port)
  })
}


module.exports = {
  regex,
  createServer
}
