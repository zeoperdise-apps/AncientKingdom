// No external packages. The distributed copy lives beside dist/.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),{execFile}=require('node:child_process');
const root=fs.existsSync(path.join(__dirname,'dist'))?path.join(__dirname,'dist'):path.resolve(__dirname,'../dist');
const port=Number(process.env.AK_PORT||5173),host='127.0.0.1',url=`http://${host}:${port}/`;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.wav':'audio/wav','.svg':'image/svg+xml','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8'};
if(!fs.existsSync(path.join(root,'index.html'))){console.error('dist/index.html がありません。ZIPをすべて展開してから起動してください。');process.exit(1);}
const server=http.createServer((req,res)=>{
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 let name;try{name=decodeURIComponent(new URL(req.url,url).pathname);}catch{res.writeHead(400);res.end();return;}
 const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 const relative=path.relative(root,file);
 if(relative.startsWith('..')||path.isAbsolute(relative)){res.writeHead(403);res.end();return;}
 fs.stat(file,(error,stat)=>{if(error||!stat.isFile()){res.writeHead(404);res.end('Not found');return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  if(req.method==='HEAD')res.end();else {const stream=fs.createReadStream(file);stream.on('error',()=>res.destroy());stream.pipe(res);}
 });
});
server.on('error',error=>{console.error(error.code==='EADDRINUSE'?`ポート${port}は使用中です。起動済みの古都を ${url} で開くか、その起動ウィンドウを閉じてから再実行してください。他のプロセスは停止しません。`:String(error));process.exitCode=1;});
server.listen(port,host,()=>{
 console.log(`古都 ～Ancient Kingdom～\n${url}\n終了: このウィンドウで Ctrl+C。プレイ中は開いたままにしてください。`);
 if(!process.argv.includes('--no-open')&&process.env.AK_NO_OPEN!=='1'){
  const executable=process.platform==='win32'?'cmd.exe':process.platform==='darwin'?'open':'xdg-open';
  const args=process.platform==='win32'?['/d','/s','/c',`start "" "${url}"`]:[url];
  execFile(executable,args,{windowsHide:true},error=>{if(error)console.log(`ブラウザで ${url} を開いてください。`);});
 }
});
