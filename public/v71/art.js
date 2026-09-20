
(function(){
  const intro = document.querySelector('.art-intro');
  if(intro){
    const seen = sessionStorage.getItem('livane_intro_seen');
    if(seen){intro.classList.add('hide');}
    else setTimeout(()=>{intro.classList.add('hide');sessionStorage.setItem('livane_intro_seen','1')},1500);
  }
  const header = document.querySelector('.art-header');
  const onScroll = ()=>{ if(header) header.classList.toggle('scrolled', window.scrollY > 20); };
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  const menu = document.querySelector('.art-menu');
  const nav = document.querySelector('.art-nav');
  if(menu && nav){
    menu.addEventListener('click',()=>{ nav.classList.toggle('open'); menu.textContent = nav.classList.contains('open') ? 'Close ×' : 'Menu +'; });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{ nav.classList.remove('open'); if(menu) menu.textContent='Menu +'; }));
  }
  if(window.innerWidth > 900){
    const cursor = document.createElement('div'); cursor.className='cursor';
    const follower = document.createElement('div'); follower.className='cursor-follower';
    document.body.append(cursor, follower);
    let x=window.innerWidth/2,y=window.innerHeight/2,fx=x,fy=y;
    window.addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;cursor.style.transform=`translate(${x-3}px,${y-3}px)`});
    const loop=()=>{fx += (x-fx)*0.18; fy += (y-fy)*0.18; follower.style.transform=`translate(${fx-19}px,${fy-19}px)`; requestAnimationFrame(loop)}; loop();
    document.querySelectorAll('a,button,summary,.scope-card,.ref-card,.refs-logo-card,.status-row').forEach(el=>{
      el.addEventListener('mouseenter',()=>follower.classList.add('is-hover'));
      el.addEventListener('mouseleave',()=>follower.classList.remove('is-hover'));
    });
  }
})();
