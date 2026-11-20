(() => {
'use strict';
const $ = s => document.querySelector(s);
const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money = n => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const state = {settings:{},products:[],promos:[],category:'Todos',cart:loadCart()};
function loadCart(){try { const saved=JSON.parse(localStorage.getItem('fran_cart')||'{}'); return saved && typeof saved==='object' && !Array.isArray(saved) ? saved : {}; }catch{return {};}}
function saveCart(){try{localStorage.setItem('fran_cart',JSON.stringify(state.cart));}catch{}}
let toastTimer;
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4000);}
function safeImage(url){return url && (/^https:\/\//i.test(url)||/^\/(uploads|assets)\//.test(url))?url:'';}
function imgHtml(p,css=''){const im=safeImage(p.image);return im ? `<img class="${css}" src="${escape(im)}" alt="${escape(p.name)}" loading="lazy">` : `<span class="image-fallback" aria-label="Imagem não disponível">🍔</span>`;}
function items(){return Object.entries(state.cart).map(([id,quantity])=>({product:state.products.find(p=>p.id===id),quantity:Number(quantity)})).filter(x=>x.product&&x.quantity>0);}
function subtotal(){return items().reduce((sum,x)=>sum+x.product.price*x.quantity,0);}
function count(){return items().reduce((sum,x)=>sum+x.quantity,0);}
function setCart(id,quantity){if (!state.products.some(p=>p.id===id))return;if(quantity<1)delete state.cart[id];else state.cart[id]=Math.min(30,quantity);saveCart();renderCart();}
function renderCart(){
 $('#cartCount').textContent=count();$('#cartSubtotal').textContent=money(subtotal());
 const arr=items();$('#cartItems').innerHTML=arr.length?arr.map(x=>`<div class="cart-row"><div class="cart-row-photo fallback">${x.product.image?`<img src="${escape(safeImage(x.product.image))}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:10px">`:'🍔'}</div><div class="cart-row-content"><h4>${escape(x.product.name)}</h4><p>${money(x.product.price*x.quantity)}</p><div class="quantity-control"><button type="button" data-minus="${escape(x.product.id)}" aria-label="Diminuir ${escape(x.product.name)}">−</button><span>${x.quantity}</span><button type="button" data-plus="${escape(x.product.id)}" aria-label="Aumentar ${escape(x.product.name)}">+</button></div><button type="button" data-remove="${escape(x.product.id)}" class="remove-item">Remover</button></div></div>`).join(''):`<div class="cart-empty"><span>🛒</span><h3>Seu carrinho está vazio</h3><p>Que tal escolher um hambúrguer delicioso?</p><button class="btn btn-fire" id="shopNow" type="button">Ver cardápio →</button></div>`;
 $('#checkoutBtn').disabled=!arr.length;
}
function openCart(){renderCart();$('#drawerOverlay').hidden=false;$('#cartDrawer').classList.add('open');$('#cartDrawer').setAttribute('aria-hidden','false');document.body.classList.add('modal-open');$('#closeCart').focus();}
function closeCart(){ $('#cartDrawer').classList.remove('open');$('#cartDrawer').setAttribute('aria-hidden','true');$('#drawerOverlay').hidden=true;document.body.classList.remove('modal-open');}
function renderMenu(){
 const cats=['Todos',...new Set(state.products.map(p=>p.category||'Outros'))];
 if(!cats.includes(state.category))state.category='Todos';
 $('#categoryTabs').innerHTML=cats.map(c=>`<button data-category="${escape(c)}" class="${state.category===c?'active':''}" type="button">${escape(c)}</button>`).join('');
 const chosen=state.products.filter(p=>state.category==='Todos'||p.category===state.category);
 $('#productGrid').innerHTML=chosen.length?chosen.map(p=>`<article class="product-card"><div class="product-image">${imgHtml(p)}${p.featured?'<span class="product-tag">EM DESTAQUE ★</span>':''}</div><div class="product-body"><div class="product-meta">${escape(p.category)}</div><h3>${escape(p.name)}</h3><p>${escape(p.description)}</p><div class="product-bottom"><strong class="product-price">${money(p.price)}</strong><button type="button" class="product-add" data-add="${escape(p.id)}" aria-label="Adicionar ${escape(p.name)} ao carrinho">+</button></div></div></article>`).join(''):'<div class="empty-state"><span class="empty-emoji">🍔</span><h3>Nenhum item por aqui</h3><p>Volte em breve para conferir nossas delícias.</p></div>';
}
function renderPromos(){const promos=state.promos;$('#promocoes').hidden=!promos.length;if(promos.length)$('#promoGrid').innerHTML=promos.map(p=>`<article class="promo-card">${p.image?`<img src="${escape(safeImage(p.image))}" alt="${escape(p.title)}" loading="lazy">`:''}${p.badge?`<span class="promo-badge">${escape(p.badge)}</span>`:''}<h3>${escape(p.title)}</h3><p>${escape(p.text)}</p><a href="#cardapio" class="promo-link">Escolher meu lanche ↗</a></article>`).join('');}
function videoEmbed(url){
 if(!url)return '';
 try{
  const u=new URL(url,location.origin);let code='';const host=u.hostname.replace(/^www\./,'').toLowerCase();
  if(host==='youtube.com'||host==='m.youtube.com'||host==='youtube-nocookie.com'){
    if(u.pathname==='/watch')code=u.searchParams.get('v')||'';
    else if(/^\/(shorts|embed)\//.test(u.pathname))code=u.pathname.split('/')[2]||'';
  }else if(host==='youtu.be')code=u.pathname.replace('/','');
  if(/^[A-Za-z0-9_-]{11}$/.test(code))return `<iframe src="https://www.youtube-nocookie.com/embed/${code}" title="Vídeo da Hamburgueria da Fran" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe>`;
  if((u.protocol==='https:'||u.origin===location.origin)&&(/\.(mp4|webm)(\?|$)/i.test(u.pathname)||/^\/uploads\/.*\.(mp4|webm)$/i.test(u.pathname)))return `<video controls preload="metadata" playsinline src="${escape(u.href)}"></video>`;
 }catch{}return '';
}
function renderSettings(){const s=state.settings;
 const title=String(s.heroTitle||'Sabor que pega fogo.').trim().split(/\s+/);$('#heroTitle').innerHTML=`${escape(title.slice(0,2).join(' '))} <em>${escape(title.slice(2).join(' '))}</em>`;
 $('#heroSubtitle').textContent=s.heroSubtitle||'';$('#announcement').textContent=s.announcement||'HAMBURGUERIA DA FRAN';$('#storyTagline').textContent=s.tagline||'';
 if(s.logoUrl)for(const target of ['#headerLogo','#heroLogo','#storyLogo','#footerLogo'])$(target).src=s.logoUrl;
 $('#demoWarning').hidden=!s.demoMode;$('#hoursText').textContent=s.openingHours||'Consulte pelo WhatsApp';
 $('#addressInfo').hidden=!s.address;if(s.address)$('#addressText').textContent=s.address;
 $('#instagramLink').hidden=!/^https:\/\//.test(s.instagram||'');if(s.instagram)$('#instagramLink').href=s.instagram;
 $('#mapLink').hidden=!/^https:\/\//.test(s.mapUrl||'');if(s.mapUrl)$('#mapLink').href=s.mapUrl;
 const video=videoEmbed(s.videoUrl);$('#videoSection').hidden=!video;if(video){$('#videoTitle').textContent=s.videoTitle||'Conheça a nossa cozinha';$('#videoDescription').textContent=s.videoDescription||'';$('#videoFrame').innerHTML=video;}
}
function checkoutDetails(){const type=$('input[name="type"]:checked')?.value||'pickup';const fee=type==='delivery'?state.settings.deliveryFee:0;const sub=subtotal();$('#deliveryFields').hidden=type!=='delivery';$('#customerAddress').required=type==='delivery';$('#customerReference').required=type==='delivery';$('#customerReference').required=type==='delivery';
 $('#checkoutItemsCount').textContent=`${count()} ${count()===1?'item':'itens'}`;$('#checkoutTotal').textContent=money(sub);$('#checkoutPriceDetails').innerHTML=`<div><span>Subtotal</span><b>${money(sub)}</b></div>${type==='delivery'?`<div><span>Taxa de entrega</span><b>${fee===null||fee===undefined?'A confirmar':money(fee)}</b></div>`:''}<div><span>${type==='delivery'&&(fee===null||fee===undefined)?'Total parcial':'Total estimado'}</span><b>${money(sub+(typeof fee==='number'?fee:0))}</b></div>`;
}
function openCheckout(){if(!count()){toast('Adicione produtos antes de continuar.');return;}closeCart();$('#checkoutOverlay').hidden=false;document.body.classList.add('modal-open');checkoutDetails();$('#customerName').focus();}
function closeCheckout(){$('#checkoutOverlay').hidden=true;document.body.classList.remove('modal-open');}
async function sendOrder(e){e.preventDefault();if(!count())return;
 const phone=$('#customerPhone').value.replace(/\D/g,'');if(phone.length<10||phone.length>15){toast('Informe um número de WhatsApp válido com DDD.');$('#customerPhone').focus();return;}
 const btn=$('#submitOrder');btn.disabled=true;btn.textContent='Preparando seu pedido...';
 const data=Object.fromEntries(new FormData(e.target).entries());data.items=items().map(x=>({id:x.product.id,quantity:x.quantity}));
 try{
  const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  const json=await response.json();if(!response.ok)throw new Error(json.error||'Não foi possível gerar seu pedido.');
  state.cart={};saveCart();renderCart();toast(`Pedido ${json.orderId} pronto! Finalize o envio no WhatsApp.`);
  window.location.assign(json.whatsappUrl);
 }catch(err){toast(err.message);}finally{btn.disabled=false;btn.innerHTML='Abrir WhatsApp com meu pedido <span>↗</span>';}
}
async function init(){
 $('#year').textContent=new Date().getFullYear();
 try{const response=await fetch('/api/site');if(!response.ok)throw new Error('Não foi possível carregar o cardápio.');const data=await response.json();state.settings=data.settings||{};state.products=data.products||[];state.promos=data.promos||[];
 const ids=new Set(state.products.map(p=>p.id));for(const key of Object.keys(state.cart))if(!ids.has(key))delete state.cart[key];saveCart();renderSettings();renderMenu();renderPromos();renderCart();
 }catch(err){toast(err.message);$('#productGrid').innerHTML='<div class="empty-state">Cardápio indisponível no momento. Tente novamente mais tarde.</div>';}
}
 $('#categoryTabs').addEventListener('click',e=>{const button=e.target.closest('[data-category]');if(!button)return;state.category=button.dataset.category;renderMenu();});
 $('#productGrid').addEventListener('click',e=>{const button=e.target.closest('[data-add]');if(!button)return;const id=button.dataset.add;setCart(id,(Number(state.cart[id])||0)+1);toast('Adicionado ao carrinho! 🍔');});
 $('#cartItems').addEventListener('click',e=>{const inc=e.target.closest('[data-plus]');const dec=e.target.closest('[data-minus]');const rem=e.target.closest('[data-remove]');if(inc)setCart(inc.dataset.plus,(Number(state.cart[inc.dataset.plus])||0)+1);if(dec)setCart(dec.dataset.minus,(Number(state.cart[dec.dataset.minus])||0)-1);if(rem)setCart(rem.dataset.remove,0);if(e.target.closest('#shopNow')){closeCart();location.hash='cardapio';}});
 $('#openCart').addEventListener('click',openCart);$('#closeCart').addEventListener('click',closeCart);$('#drawerOverlay').addEventListener('click',closeCart);
 $('#checkoutBtn').addEventListener('click',openCheckout);$('#closeCheckout').addEventListener('click',closeCheckout);$('#checkoutOverlay').addEventListener('click',e=>{if(e.target.id==='checkoutOverlay')closeCheckout();});
 document.querySelectorAll('input[name="type"]').forEach(input=>input.addEventListener('change',checkoutDetails));$('#checkoutForm').addEventListener('submit',sendOrder);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#checkoutOverlay').hidden)closeCheckout();else if($('#cartDrawer').classList.contains('open'))closeCart();}});
 $('#mobileMenuBtn').addEventListener('click',()=>{const n=$('#mobileNav');n.classList.toggle('open');$('#mobileMenuBtn').setAttribute('aria-expanded',n.classList.contains('open'));});$('#mobileNav').addEventListener('click',e=>{if(e.target.closest('a')){$('#mobileNav').classList.remove('open');$('#mobileMenuBtn').setAttribute('aria-expanded','false');}});
 document.addEventListener('error',e=>{if(e.target instanceof HTMLImageElement&&e.target.closest('.product-image,.cart-row-photo')){const wrap=e.target.parentElement;e.target.remove();if(!wrap.querySelector('.image-fallback')){const span=document.createElement('span');span.className='image-fallback';span.textContent='🍔';wrap.appendChild(span);}}},true);
 init();
})();
