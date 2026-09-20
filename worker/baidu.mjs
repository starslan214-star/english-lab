// 百度通用文本翻译请求只在服务端签名，密钥不会进入页面脚本。
export async function translateBaidu(text,from,to,credentials){
  const salt=crypto.randomUUID().replaceAll('-','');
  const sign=md5(credentials.appid+text+salt+credentials.key);
  const body=new URLSearchParams({q:text,from,to,appid:credentials.appid,salt,sign});
  const response=await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error('百度翻译暂时无法连接。');
  const data=await response.json();
  if(data.error_code){
    const errors={'52001':'请求超时，请重试。','52002':'百度翻译服务暂不可用。','52003':'APP ID 未获授权，请检查是否开通通用文本翻译。','54000':'请求格式有误。','54001':'APP ID 或密钥无效。','54003':'请求过于频繁，请稍后再试。','54004':'百度翻译账户余额不足。','54005':'请求过于频繁，请稍后再试。','58000':'百度翻译拒绝了当前服务器 IP，请检查百度控制台中的 IP 白名单。','58001':'此语种方向尚未开通。','58002':'此账号服务已关闭。','58003':'百度翻译暂时封禁了本站调用 IP（58003）。官方说明通常次日解除；如属于误封，请联系 translate_api@baidu.com。','90107':'百度翻译认证失败。'};
    throw new Error(errors[data.error_code]||`百度翻译返回错误 ${data.error_code}。`);
  }
  const results=Array.isArray(data.trans_result)?data.trans_result.filter(item=>typeof item.dst==='string').map(item=>({source:item.src||text,target:item.dst})):[];
  if(!results.length)throw new Error('百度翻译没有返回结果。');
  return {from:data.from||from,to:data.to||to,results,source:'百度翻译'};
}
