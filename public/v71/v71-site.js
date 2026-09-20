(()=>{
  document.documentElement.classList.add('v71-ready');
  const y=document.querySelector('#yr,#lv-year'); if(y) y.textContent=new Date().getFullYear();
  document.querySelectorAll('a[href^="tel:"]').forEach(a=>{a.href='tel:+14074595565'; if(!a.textContent.trim().includes('407')) a.textContent='(407) 459-5565';});
})();
