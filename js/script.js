document.addEventListener('DOMContentLoaded', function(){
  const burger = document.querySelector('.burger');
  const navUL = document.querySelector('.main-nav ul');
  if(burger && navUL){
    burger.addEventListener('click', ()=>{ navUL.classList.toggle('show'); burger.classList.toggle('open'); });
  }
  document.querySelectorAll('.main-nav .dropdown > a').forEach(function(btn){
    btn.addEventListener('click', function(e){
      const menu = btn.parentElement.querySelector('.dropdown-content');
      if(!menu)return;
      e.preventDefault();
      document.querySelectorAll('.dropdown-content').forEach(function(m){
        if(m!==menu) m.classList.remove('show');
      });
      menu.classList.toggle('show');
    });
  });
  document.addEventListener('click', function(e){
    if(!e.target.closest('.main-nav')){
      document.querySelectorAll('.dropdown-content').forEach(function(m){ m.classList.remove('show'); });
      if(navUL) navUL.classList.remove('show');
    }
  });
});