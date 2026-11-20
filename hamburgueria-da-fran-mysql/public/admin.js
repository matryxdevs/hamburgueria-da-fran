(() => {
'use strict';
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n)||0);
const dateText=s=>new Date(s).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});
const ADMIN_HEADERS={'X-Fran-Admin':'1'};
const tabs={overview:'Visão geral',products:'Cardápio',promos:'Propagandas',settings:'Personalizar site',orders:'Pedidos'};
let db={settings:{},products:[],promos:[],orders:[]};let editorKind='', editorId='';let toastTimer;
function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3800);}
async function api(path,options={}){
 const res=await fetch(path,{credentials:'same-origin',...options,headers:{...ADMIN_HEADERS,...(options.headers||{})}});
 let data;try{data=await res.json();}catch{data={};}
 if(!res.ok){if(res.status===401&&path!=='/api/admin/login')showLogin();throw new Error(data.error||'Falha na solicitação.');}
 return data;
}
const jsonOptions=(method,obj)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(obj)});
function showLogin(){$('#adminLogin').hidden=false;$('#adminShell').hidden=true;}
async function showAdmin(){$('#adminLogin').hidden=true;$('#adminShell').hidden=false;await refresh();}
async function refresh(){const data=await api('/api/admin/data');db=data;renderAll();}
function navigate(tab){if(!tabs[tab])return;document.querySelectorAll('.admin-tab').forEach(el=>el.hidden=el.id!==`tab-${tab}`);document.querySelectorAll('[data-tab]').forEach(el=>el.classList.toggle('active',el.dataset.tab===tab));$('#adminPageTitle').textContent=tabs[tab];if(tab==='settings')renderSettings();window.scrollTo({top:0,behavior:'smooth'});}
function renderAll(){renderOverview();renderProducts();renderPromos();renderOrders();renderSettings();}
function renderOverview(){const o=db.orders||[];const s=db.settings||{};
 $('#statProducts').textContent=db.products.length;$('#statOrders').textContent=o.length;$('#statPending').textContent=o.filter(x=>!['Entregue','Cancelado'].includes(x.status)).length;$('#statPromos').textContent=db.promos.filter(x=>x.active).length;$('#sideOrderCount').textContent=o.filter(x=>!['Entregue','Cancelado'].includes(x.status)).length;
 const list=[{done:/^\d{10,15}$/.test(s.whatsappNumber||''),label:'Configurar WhatsApp de recebimento'},{done:!!s.address,label:'Informar endereço da hamburgueria'},{done:!s.demoMode,label:'Substituir produtos demonstrativos'},{done:!!s.videoUrl,label:'Inserir vídeo de apresentação'}];
 $('#setupChecklist').innerHTML=list.map(x=>`<div class="setup-item ${x.done?'done':''}"><span>${x.done?'✓':'○'}</span>${esc(x.label)}</div>`).join('');
 $('#recentOrders').innerHTML=o.length?o.slice(0,4).map(x=>`<div class="recent-order"><div><b>${esc(x.id)}</b><small>${esc(x.customer)} • ${dateText(x.createdAt)}</small></div><strong>${money(x.subtotal)}</strong></div>`).join(''):'<p style="font-size:13px;color:#a28e80">Nenhum pedido iniciado até agora.</p>';
}
function renderProducts(){const products=[...db.products].sort((a,b)=>a.sort-b.sort);
 $('#productsTable').innerHTML=products.length?products.map(p=>`<tr><td><div class="product-cell"><img class="product-thumb" src="${esc(p.image||'/assets/logo.png')}" alt=""><div><b>${esc(p.name)}</b><small>${esc(p.description).slice(0,55)}</small></div></div></td><td>${esc(p.category)}</td><td><b>${money(p.price)}</b></td><td><span class="pill ${p.available?'':'off'}">${p.available?'Disponível':'Oculto'}</span></td><td><div class="table-actions"><button data-edit-product="${esc(p.id)}">Editar</button><button class="danger" data-delete-product="${esc(p.id)}">Excluir</button></div></td></tr>`).join(''):'<tr><td colspan="5">Nenhum produto cadastrado.</td></tr>';
}
function renderPromos(){$('#adminPromos').innerHTML=db.promos.length?db.promos.map(p=>`<article class="admin-promo-card"><div class="admin-promo-banner"><span>${esc(p.badge)}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p></div><div class="admin-promo-actions"><span class="pill ${p.active?'':'off'}">${p.active?'Ativa':'Desativada'}</span><div class="table-actions"><button data-edit-promo="${esc(p.id)}">Editar</button><button class="danger" data-delete-promo="${esc(p.id)}">Excluir</button></div></div></article>`).join(''):'<div class="admin-panel">Nenhuma propaganda cadastrada.</div>';}
const statuses=['Aguardando envio no WhatsApp','Recebido','Em preparo','Pronto','Entregue','Cancelado'];
function renderOrders(){const orders=db.orders||[];
 $('#ordersTable').innerHTML=orders.length?orders.map(o=>`<tr><td><b>${esc(o.id)}</b><br/><small>${dateText(o.createdAt)}</small></td><td><b>${esc(o.customer)}</b><br/><small>${esc(o.phone)}</small></td><td>${o.type==='delivery'?'🛵 Entrega':'🏪 Retirada'}</td><td><b>${money(o.subtotal)}</b></td><td><select class="status-select" data-order-status="${esc(o.id)}">${statuses.map(st=>`<option ${o.status===st?'selected':''}>${esc(st)}</option>`).join('')}</select></td><td><div class="table-actions"><button data-order-detail="${esc(o.id)}">Detalhes</button></div></td></tr>`).join(''):'<tr><td colspan="6">Nenhum pedido iniciado no site.</td></tr>';
}
function renderSettings(){const s=db.settings||{};const names={businessName:'settingBusiness',heroTitle:'settingHeroTitle',heroSubtitle:'settingHeroSubtitle',tagline:'settingTagline',announcement:'settingAnnouncement',whatsappNumber:'settingWhatsapp',address:'settingAddress',openingHours:'settingHours',instagram:'settingInstagram',mapUrl:'settingMap',videoTitle:'settingVideoTitle',videoDescription:'settingVideoDescription',videoUrl:'settingVideoUrl',logoUrl:'settingLogoUrl'};
 for(const [key,el] of Object.entries(names))$('#'+el).value=s[key]??'';
 $('#settingFee').value=s.deliveryFee===null||s.deliveryFee===undefined?'':s.deliveryFee;$('#settingDemoMode').checked=!!s.demoMode;
}
function inputField({name,label,value='',type='text',required=false,placeholder='',rows=0}){
 const field=rows?`<textarea id="edit-${name}" name="${name}" rows="${rows}" ${required?'required':''} placeholder="${esc(placeholder)}">${esc(value)}</textarea>`:`<input id="edit-${name}" name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''} placeholder="${esc(placeholder)}" ${type==='number'?'min="0" step="0.01"':''}>`;
 return `<div class="field"><label for="edit-${name}">${esc(label)}</label>${field}</div>`;
}
function openEditor(kind,id=''){
 editorKind=kind;editorId=id;let current;
 if(kind==='product'){current=db.products.find(x=>x.id===id)||{};$('#editorTitle').textContent=id?'Editar produto':'Novo produto';
 $('#editorFields').innerHTML=`${inputField({name:'name',label:'Nome do produto *',value:current.name,required:true,placeholder:'Ex.: X-Bacon da Fran'})}${inputField({name:'category',label:'Categoria *',value:current.category||'Hambúrgueres',required:true,placeholder:'Hambúrgueres, Bebidas, Acompanhamentos...'})}${inputField({name:'price',label:'Preço (R$) *',type:'number',value:current.price??'',required:true})}${inputField({name:'description',label:'Descrição',rows:3,value:current.description,placeholder:'Ingredientes e detalhes do lanche'})}${inputField({name:'image',label:'URL da imagem',value:current.image,placeholder:'https://... ou use o botão de envio'})}<label class="upload-label">📷 Enviar foto do produto <input type="file" id="editFileUpload" accept="image/png,image/jpeg,image/webp"></label>${current.image?`<img class="image-preview" src="${esc(current.image)}" alt="Prévia da imagem">`:''}${inputField({name:'sort',label:'Ordem de exibição',type:'number',value:current.sort??db.products.length+1})}<label class="toggle-line"><input type="checkbox" name="available" ${current.available!==false?'checked':''}/><span>Disponível no cardápio</span></label><label class="toggle-line"><input type="checkbox" name="featured" ${current.featured?'checked':''}/><span>Mostrar selo de destaque</span></label>`;
 }else{current=db.promos.find(x=>x.id===id)||{};$('#editorTitle').textContent=id?'Editar propaganda':'Nova propaganda';
 $('#editorFields').innerHTML=`${inputField({name:'title',label:'Título da propaganda *',value:current.title,required:true,placeholder:'Ex.: Sextou com sabor!'})}${inputField({name:'badge',label:'Etiqueta',value:current.badge||'DESTAQUE',placeholder:'PROMOÇÃO, NOVO...'})}${inputField({name:'text',label:'Descrição',rows:3,value:current.text,placeholder:'Texto do anúncio'})}${inputField({name:'image',label:'Imagem de fundo (opcional)',value:current.image,placeholder:'https://... ou envie uma imagem'})}<label class="upload-label">📷 Enviar imagem da propaganda <input type="file" id="editFileUpload" accept="image/png,image/jpeg,image/webp"></label>${current.image?`<img class="image-preview" src="${esc(current.image)}" alt="Prévia da imagem">`:''}<label class="toggle-line"><input type="checkbox" name="active" ${current.active!==false?'checked':''}/><span>Propaganda ativa</span></label>`;
 }
 $('#editorOverlay').hidden=false;document.body.classList.add('modal-open');$('#editorFields input:first-child')?.focus();
}
function closeEditor(){$('#editorOverlay').hidden=true;document.body.classList.remove('modal-open');editorKind='';editorId='';}
function readFile(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Falha ao ler arquivo.'));reader.onload=()=>resolve(reader.result);reader.readAsDataURL(file);});}
async function upload(file){if(!file)return null;const video=file.type.startsWith('video/');const max=video?28*1024*1024:5*1024*1024;if(file.size>max)throw new Error(video?'Vídeo maior que 28 MB.':'Imagem maior que 5 MB.');
 const dataUrl=await readFile(file);const saved=await api('/api/admin/upload',jsonOptions('POST',{dataUrl}));return saved.url;
}
async function saveEditor(e){e.preventDefault();const btn=$('#saveEditor');btn.disabled=true;btn.textContent='Salvando...';
 try{
  const kindBeingSaved=editorKind;const form=new FormData(e.target);const obj=Object.fromEntries(form.entries());delete obj.available;delete obj.featured;delete obj.active;
  if(editorKind==='product'){obj.available=e.target.querySelector('[name="available"]').checked;obj.featured=e.target.querySelector('[name="featured"]').checked;}else obj.active=e.target.querySelector('[name="active"]').checked;
  const file=$('#editFileUpload')?.files?.[0];if(file)obj.image=await upload(file);
  const uri=`/api/admin/${editorKind==='product'?'products':'promos'}${editorId?`/${editorId}`:''}`;
  await api(uri,jsonOptions(editorId?'PUT':'POST',obj));closeEditor();await refresh();toast(kindBeingSaved==='product'?'Produto salvo!':'Propaganda salva!');
 }catch(err){toast(err.message);}finally{btn.disabled=false;btn.textContent='Salvar alterações ✓';}
}
async function deleteItem(kind,id){const product=kind==='product';const entry=(product?db.products:db.promos).find(x=>x.id===id);if(!entry)return;
 if(!confirm(`Excluir ${product?'o produto':'a propaganda'} “${entry.name||entry.title}”? Esta ação não pode ser desfeita.`))return;
 try{await api(`/api/admin/${product?'products':'promos'}/${id}`,{method:'DELETE'});await refresh();toast('Item excluído.');}catch(err){toast(err.message);}
}
async function saveSettings(e){e.preventDefault();const btn=$('#saveSettingsBtn');btn.disabled=true;btn.textContent='Salvando...';
 try{const form=new FormData(e.target);const obj=Object.fromEntries(form.entries());obj.demoMode=$('#settingDemoMode').checked;
  const video=$('#videoUploadInput').files[0];const logo=$('#logoUploadInput').files[0];
  if(video){obj.videoUrl=await upload(video);$('#videoUploadStatus').textContent=`Vídeo enviado: ${video.name}`;}
  if(logo)obj.logoUrl=await upload(logo);
  await api('/api/admin/settings',jsonOptions('PUT',obj));await refresh();toast('Configurações atualizadas com sucesso!');
 }catch(err){toast(err.message);}finally{btn.disabled=false;btn.textContent='Salvar alterações ✓';}
}
function showOrder(id){const o=db.orders.find(x=>x.id===id);if(!o)return;
 $('#orderDetailTitle').textContent=`Pedido ${o.id}`;
 const info=(label,v)=>`<div class="detail-info"><b>${esc(label)}:</b> ${esc(v||'-')}</div>`;
 $('#orderDetailBody').innerHTML=`<div class="detail-body">${info('Data',dateText(o.createdAt))}${info('Cliente',o.customer)}${info('WhatsApp',o.phone)}${info('Modalidade',o.type==='delivery'?'Entrega':'Retirada no local')}${o.type==='delivery'?info('Endereço',o.address)+info('Referência',o.reference):''}${info('Pagamento',o.payment)}${info('Status',o.status)}<h3 style="margin:20px 0 10px">Itens do pedido</h3>${o.items.map(p=>`<div class="detail-item"><span>${p.quantity}x ${esc(p.name)}</span><b>${money(p.total)}</b></div>`).join('')}<div class="detail-item"><span>Subtotal</span><b>${money(o.subtotal)}</b></div>${o.type==='delivery'?`<div class="detail-item"><span>Entrega</span><b>${o.fee===null?'A confirmar':money(o.fee)}</b></div>`:''}<div class="detail-total"><span>${o.total===null?'Total parcial':'Total'}</span><span>${money(o.total===null?o.subtotal:o.total)}</span></div>${o.note?`<div class="detail-note"><b>Observações:</b> ${esc(o.note)}</div>`:''}<a href="https://wa.me/${esc(o.phone)}" target="_blank" rel="noopener noreferrer" class="btn btn-fire btn-block" style="margin-top:18px">Conversar com cliente ↗</a><button type="button" class="btn btn-soft btn-block" data-delete-order="${esc(o.id)}" style="margin-top:10px">Excluir registro do pedido</button></div>`;
 $('#orderDetailOverlay').hidden=false;document.body.classList.add('modal-open');
}
function closeOrderDetail(){$('#orderDetailOverlay').hidden=true;document.body.classList.remove('modal-open');}
async function init(){
 try{const result=await api('/api/admin/me');if(result.authenticated)await showAdmin();else showLogin();}catch{showLogin();}
}
$('#loginForm').addEventListener('submit',async e=>{e.preventDefault();const btn=$('#loginButton');btn.disabled=true;btn.textContent='Entrando...';try{await api('/api/admin/login',jsonOptions('POST',{email:$('#loginEmail').value,password:$('#loginPassword').value}));$('#loginPassword').value='';await showAdmin();toast('Bem-vindo ao painel!');}catch(err){toast(err.message);}finally{btn.disabled=false;btn.textContent='Entrar no painel →';}});
$('#logoutBtn').addEventListener('click',async()=>{try{await api('/api/admin/logout',{method:'POST'});}catch{}showLogin();});
$('#adminNav').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)navigate(b.dataset.tab);});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go-tab]');if(b)navigate(b.dataset.goTab);});
$('#addProductBtn').addEventListener('click',()=>openEditor('product'));$('#addPromoBtn').addEventListener('click',()=>openEditor('promo'));
$('#productsTable').addEventListener('click',e=>{const edit=e.target.closest('[data-edit-product]');const del=e.target.closest('[data-delete-product]');if(edit)openEditor('product',edit.dataset.editProduct);if(del)deleteItem('product',del.dataset.deleteProduct);});
$('#adminPromos').addEventListener('click',e=>{const edit=e.target.closest('[data-edit-promo]');const del=e.target.closest('[data-delete-promo]');if(edit)openEditor('promo',edit.dataset.editPromo);if(del)deleteItem('promo',del.dataset.deletePromo);});
$('#editorForm').addEventListener('submit',saveEditor);$('#closeEditor').addEventListener('click',closeEditor);$('#editorOverlay').addEventListener('click',e=>{if(e.target.id==='editorOverlay')closeEditor();});
$('#settingsForm').addEventListener('submit',saveSettings);
$('#refreshOrders').addEventListener('click',async()=>{try{await refresh();toast('Pedidos atualizados.');}catch(err){toast(err.message);}});
$('#ordersTable').addEventListener('change',async e=>{const el=e.target.closest('[data-order-status]');if(!el)return;try{await api(`/api/admin/orders/${el.dataset.orderStatus}`,jsonOptions('PATCH',{status:el.value}));await refresh();toast('Status atualizado.');}catch(err){toast(err.message);await refresh();}});
$('#ordersTable').addEventListener('click',e=>{const b=e.target.closest('[data-order-detail]');if(b)showOrder(b.dataset.orderDetail);});
$('#orderDetailBody').addEventListener('click',async e=>{const b=e.target.closest('[data-delete-order]');if(!b)return;const id=b.dataset.deleteOrder;if(!confirm(`Excluir definitivamente o registro do pedido ${id}?`))return;try{await api('/api/admin/orders/'+id,{method:'DELETE'});closeOrderDetail();await refresh();toast('Pedido excluído.');}catch(err){toast(err.message);}});
$('#closeOrderDetail').addEventListener('click',closeOrderDetail);$('#orderDetailOverlay').addEventListener('click',e=>{if(e.target.id==='orderDetailOverlay')closeOrderDetail();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('#editorOverlay').hidden)closeEditor();else if(!$('#orderDetailOverlay').hidden)closeOrderDetail();}});
init();
})();
