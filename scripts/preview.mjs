// 在本机预览已打包的 Worker 页面与接口。
import {createServer} from 'node:http';
import worker from '../dist/server/index.js';

const port=4175;
const env={ENGLISH_LAB_COOKIE_KEY:'cd'.repeat(32)};
createServer(async(req,res)=>{
  try{
    const chunks=[];for await(const chunk of req)chunks.push(chunk);
    const body=chunks.length?Buffer.concat(chunks):undefined;
    const request=new Request(`http://127.0.0.1:${port}${req.url}`,{method:req.method,headers:req.headers,body});
    const response=await worker.fetch(request,env);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  }catch(error){res.writeHead(500);res.end(String(error))}
}).listen(port,'127.0.0.1',()=>console.log(`http://127.0.0.1:${port}/`));
