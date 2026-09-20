// English Lab 产品版本遵循语义化版本：主版本.功能版本.修复版本。
const ENGLISH_LAB_VERSION='1.2.0';
const versionLabel=document.createElement('small');
versionLabel.className='app-version';
versionLabel.title='English Lab 产品版本';
versionLabel.textContent=`English Lab · v${ENGLISH_LAB_VERSION}`;
versionLabel.style.cssText='display:block;margin-top:18px;color:#7f949d;font-size:11px;letter-spacing:.08em';
document.querySelector('.side-bottom')?.append(versionLabel);
