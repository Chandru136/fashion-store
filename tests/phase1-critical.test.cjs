// Sudha Collections isolated regression contracts. Known security defects intentionally fail.
// Application source is read/transpiled in memory. Every runtime import is a mock;
// no Prisma client, environment, network, email, or writable filesystem is exposed.
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),zod=require('zod');
function load(file,deps={},globals={}) {
 const ctx={exports:{},...globals,require:n=>{if(!Object.hasOwn(deps,n))throw Error('Blocked import '+n);return deps[n];}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,ctx,{filename:file,timeout:2000});return ctx.exports;
}
const sharp=require('sharp');
const imageValidation=load('lib/product-image-validation.ts',{sharp});
const permissions=load('lib/permissions.ts');
const schema=load('lib/validations/product.ts',{zod});
const createOrderHarness=require('./helpers/order-lifecycle-harness.cjs');
const input={name:'Sudha Collections test',slug:'sudha-collections-test',sku:'SC-TEST',description:'Isolated test product',categoryId:'SC-category',mrp:100,sellingPrice:90,images:[{url:'/uploads/products/SC-test.png'}],variants:[{sku:'SC-V',price:90,stock:2}]};
function actions(role,status='ACTIVE',sessionRole=role) {
 const writes=[],emails=[],row={id:'SC-order',slug:input.slug,images:[{id:'SC-image'}],variants:[{id:'SC-variant'}],status:'CONFIRMED',paymentStatus:'PAID',user:{name:'Sudha Collections',email:'sc@example.invalid'},items:[],orderNumber:'SC-TEST'};
 const actor=role?{id:'SC-actor',role,status}:null,prisma={};
 for(const model of ['product','productImage','productVariant','inventory','category','order']) {
  prisma[model]={findUnique:async()=>row};
  for(const method of ['create','update','upsert','updateMany'])prisma[model][method]=async args=>{writes.push({model,method,args});return {...row,...args.data};};
 }
 prisma.user={findUnique:async()=>actor};prisma.$transaction=async fn=>fn(prisma);
 const deps={'@/lib/db':{prisma},'@/lib/validations/product':schema,'@prisma/client':{Prisma:{PrismaClientKnownRequestError:class extends Error{}}},'next/cache':{revalidatePath(){}},zod,
 'next/headers':{cookies:async()=>({get:()=>sessionRole?{value:'SC-test-token'}:undefined})},'@/lib/auth':{verifySessionToken:async()=>sessionRole?{id:'SC-actor',role:sessionRole}:null,getSessionUser:async()=>status==='ACTIVE'?actor:null},
 '@/lib/session-config':{SESSION_COOKIE_NAME:'sudha_collections_session_user'},'@/lib/permissions':permissions,'@/lib/services/order.service':{},'@/lib/validations/order':{},'@/lib/mailer':{sendEmail:async a=>emails.push(a)},'@/lib/email-templates':{orderStatusUpdateHtml:()=>''}};
 row.items=[{variantId:'SC-variant',quantity:2,productName:'Sudha Collections',sku:'SC-V',totalPrice:90}];
 const lifecycleHarness=createOrderHarness(load,{order:row,writes});
 deps['@/lib/payments/lifecycle.service']=lifecycleHarness.api;
 deps['@/lib/validations/order']=load('lib/validations/order.ts',{zod});
 deps['@/lib/admin-authorization']=load('lib/admin-authorization.ts',deps);
 return {admin:load('app/actions/admin.actions.ts',deps),order:load('app/actions/order.actions.ts',deps),writes,emails,row};
}
// Approved policy: deactivation requires DELETE_PRODUCTS, no separate status permission exists.
const cases=[['createProductAction','CREATE_PRODUCTS',[input]],['updateProductAction','UPDATE_PRODUCTS',['SC-product',input]],['setProductStatusAction','DELETE_PRODUCTS',['SC-product','INACTIVE']],['deleteProductAction','DELETE_PRODUCTS',['SC-product']],['updateStockAction','UPDATE_INVENTORY',['SC-variant',3]],['updateOrderStatusAction','UPDATE_ORDERS',['SC-order','PROCESSING']]];
for(const role of [null,...Object.keys(permissions.ROLE_PERMISSIONS)])for(const [name,p,args]of cases)test(`authorization ${role||'anonymous'} ${name}`,async()=>{
 const h=actions(role),r=await(h.admin[name]||h.order[name])(...args),allowed=!!role&&permissions.hasPermission(role,permissions.PERMISSIONS[p]);assert.equal(h.writes.length>0,allowed,'mutation permission '+p);assert.equal(r.success,allowed);
});
for(const [name,,args]of cases)test('blocked admin '+name,async()=>{const h=actions('ADMIN','BLOCKED');await(h.admin[name]||h.order[name])(...args);assert.equal(h.writes.length,0);});
test('invalid stock never writes',async()=>{for(const stock of [-1,0.5,NaN,'2']){const h=actions('ADMIN');assert.equal((await h.admin.updateStockAction('SC-variant',stock)).success,false);assert.equal(h.writes.length,0);}});
class TestFile {
 constructor(type,size,bytes){this.type=type;this.size=size;this.bytes=bytes;}
 async arrayBuffer(){
  if(this.bytes)return this.bytes;
  if(this.size<10)return Buffer.alloc(this.size);
  const png=await sharp({create:{width:1,height:1,channels:3,background:'red'}}).png().toBuffer();
  const result=Buffer.alloc(Math.max(png.length,this.size));png.copy(result);return result;
 }
}
function upload(role,status='ACTIVE',sessionRole=role){
 const writes=[],calls={parsed:0};const actor=role==='anonymous'||!role?null:{id:'SC-actor',role,status};
 const guard=load('lib/admin-authorization.ts',{'next/headers':{cookies:async()=>({get:name=>{assert.equal(name,'sudha_collections_session_user');return {value:'SC-token'};}})},'@/lib/auth':{verifySessionToken:async()=>sessionRole==='anonymous'||!sessionRole?null:{id:'SC-actor',role:sessionRole}},'@/lib/db':{prisma:{user:{findUnique:async()=>actor}}},'@/lib/session-config':{SESSION_COOKIE_NAME:'sudha_collections_session_user'},'@/lib/permissions':permissions});
 const api=load('app/api/admin/product-images/route.ts',{'@/lib/admin-authorization':guard,'@/lib/permissions':permissions,'@/lib/product-image-validation':imageValidation,crypto:{randomUUID:()=> 'SC-image'},'fs/promises':{mkdir:async(...a)=>writes.push(a),writeFile:async(...a)=>writes.push(a)},path:{join:(...a)=>a.join('/')},'next/server':{NextResponse:{json:(body,o)=>({body,status:o.status})}}},{File:TestFile,Buffer,process:{cwd:()=>'/sudha-collections-test'}});
 return{writes,api,calls,post:image=>api.POST({formData:async()=>{calls.parsed++;return{get:()=>image};}})};
}
for(const role of ['anonymous','CUSTOMER','INVENTORY_MANAGER','ORDER_MANAGER','CONTENT_MANAGER'])test('upload rejects '+role,async()=>{const h=upload(role),r=await h.post(new TestFile('image/png',10));assert.equal(h.writes.length,0);assert.ok([401,403].includes(r.status));assert.equal(h.calls.parsed,0);});
for(const [name,image]of [['missing',null],['string','image'],['MIME',new TestFile('text/plain',10)],['empty',new TestFile('image/png',0)],['oversize',new TestFile('image/png',5242881)]])test('upload validation '+name,async()=>{const h=upload('ADMIN');assert.equal((await h.post(image)).status,400);assert.equal(h.writes.length,0);});
test('exactly 5 MiB accepted under current limit',async()=>{const h=upload('ADMIN');assert.equal((await h.post(new TestFile('image/png',5242880))).status,201);assert.equal(h.writes.length,2);});
test('malformed form has no writes; current response 500',async()=>{const h=upload('ADMIN');assert.equal((await h.api.POST({formData:async()=>{throw Error('Malformed');}})).status,500);assert.equal(h.writes.length,0);});
test('spoofed image content rejected',async()=>{const h=upload('ADMIN');await h.post(new TestFile('image/png',2));assert.equal(h.writes.length,0);});
for(const [from,to]of [['DELIVERED','PENDING'],['SHIPPED','CANCELLED'],['CONFIRMED','REFUNDED'],['CANCELLED','PROCESSING']])test(`transition ${from} -> ${to} rejected`,async()=>{const h=actions('ADMIN');h.row.status=from;await h.order.updateOrderStatusAction('SC-order',to);assert.equal(h.writes.length,0);});
test('paid cancellation restores inventory',async()=>{const h=actions('ADMIN');await h.order.updateOrderStatusAction('SC-order','CANCELLED');assert.ok(h.writes.some(w=>w.model==='inventory'),'lifecycle was bypassed');});
test('duplicate cancellation does not mutate or email',async()=>{const h=actions('ADMIN');h.row.status='CANCELLED';await h.order.updateOrderStatusAction('SC-order','CANCELLED');assert.equal(h.writes.length,0);assert.equal(h.emails.length,0);});
function lifecycle(paid=true,committed=false,status='CONFIRMED'){
 const h=createOrderHarness(load,{order:{status,paymentStatus:paid?'PAID':'PENDING',inventoryCommittedAt:committed?new Date():null}});
 if(committed)h.state.inventory.reservedStock=0;
 return h;
}
for(const paid of [false,true])for(const committed of [false,true])test(`service cancellation paid=${paid} committed=${committed}`,async()=>{
 const h=lifecycle(paid,committed);
 if(committed){await assert.rejects(()=>h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test'));assert.equal(h.writes.length,0);return;}
 for(let i=0;i<2;i++)await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test');
 assert.equal(h.state.inventory.availableStock,5);assert.equal(h.state.inventory.reservedStock,0);assert.equal(h.state.stock,5);assert.equal(h.state.coupon,0);assert.equal(!!h.state.refund,paid);assert.equal(h.state.audits.length,1);assert.equal(h.row.status,'CANCELLED');assert.ok(h.row.inventoryReleasedAt);
});
test('service denies shipped or wrong owner without mutations',async()=>{for(const [status,userId]of [['SHIPPED','SC-owner'],['CONFIRMED','SC-other']]){const h=lifecycle(true,false,status);await assert.rejects(()=>h.api.cancelOrder('SC-order',{userId,admin:false},'Sudha Collections test'));assert.equal(h.writes.length,0);}});
test('one root homepage route',()=>{const pages=['app/page.tsx','app/(store)/page.tsx'].filter(file=>{try{fs.readFileSync(file);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}});assert.equal(pages.length,1);});
test('seed avoids literal passwords',()=>{assert.equal(/bcrypt\.hash\(["']/.test(fs.readFileSync('prisma/seed.ts','utf8')),false,'seed contains literal passwords');});
test('seed avoids unscoped collection deletion',()=>{assert.equal(/collection\.deleteMany\(\{\}\)/.test(fs.readFileSync('prisma/seed.ts','utf8')),false,'seed contains unscoped deletion');});
// Phase 2A additions: exercise the real guard and image decoder inside the isolated harness.
for(const [role,status,sessionRole] of [['CUSTOMER','ACTIVE','ADMIN'],['ADMIN','BLOCKED','ADMIN'],[null,'ACTIVE','ADMIN'],['ADMIN','ACTIVE',null]]) {
 for(const [name,,args] of cases)test(`current identity ${role}/${status}/token=${sessionRole}: ${name}`,async()=>{
  const h=actions(role,status,sessionRole);const result=await(h.admin[name]||h.order[name])(...args);assert.equal(result.success,false);assert.equal(h.writes.length,0);assert.equal(h.emails.length,0);
 });
 test(`upload current identity ${role}/${status}/token=${sessionRole}`,async()=>{const h=upload(role,status,sessionRole);const r=await h.post(new TestFile('image/png',100));assert.ok([401,403].includes(r.status));assert.equal(h.calls.parsed,0);assert.equal(h.writes.length,0);});
}
test('current database role grants permission despite stale lower token role',async()=>{const h=actions('ADMIN','ACTIVE','CUSTOMER');assert.equal((await h.admin.updateStockAction('SC-variant',3)).success,true);assert.equal(h.writes.length,2);});
test('product manager edits metadata without stock or inventory writes',async()=>{
 const h=actions('PRODUCT_MANAGER');h.row.status='ACTIVE';
 const result=await h.admin.updateProductAction('SC-product',{...input,variants:[{...input.variants[0],stock:999999}]});
 assert.equal(result.success,true);assert.ok(h.writes.some(w=>w.model==='product'));
 assert.ok(h.writes.some(w=>w.model==='productVariant'));assert.ok(!h.writes.some(w=>w.model==='inventory'));
 for(const w of h.writes.filter(w=>w.model==='productVariant'))assert.equal(Object.hasOwn(w.args.data,'stock'),false);
});
test('admin edit retains authorized stock writes',async()=>{const h=actions('ADMIN');await h.admin.updateProductAction('SC-product',input);assert.equal(h.writes.find(w=>w.model==='productVariant').args.data.stock,2);assert.equal(h.writes.find(w=>w.model==='inventory').args.update.availableStock,2);});
for(const status of ['INACTIVE','ARCHIVED'])test('deactivation through edit requires DELETE_PRODUCTS: '+status,async()=>{const h=actions('PRODUCT_MANAGER');h.row.status='ACTIVE';assert.equal((await h.admin.updateProductAction('SC-product',{...input,status})).success,false);assert.equal(h.writes.length,0);});
test('product manager may edit already inactive details without rewriting status',async()=>{const h=actions('PRODUCT_MANAGER');h.row.status='INACTIVE';assert.equal((await h.admin.updateProductAction('SC-product',{...input,status:'INACTIVE'})).success,true);assert.equal(Object.hasOwn(h.writes.find(w=>w.model==='product').args.data,'status'),false);});
test('product manager may activate; invalid status never writes',async()=>{const h=actions('PRODUCT_MANAGER');assert.equal((await h.admin.setProductStatusAction('SC-product','ACTIVE')).success,true);for(const status of ['BOGUS',{},null]){const h=actions('ADMIN');assert.equal((await h.admin.setProductStatusAction('SC-product',status)).success,false);assert.equal(h.writes.length,0);}});
test('anonymous create cannot upsert a new category',async()=>{const h=actions(null);assert.equal((await h.admin.createProductAction({...input,categoryId:''},'Sudha Collections')).success,false);assert.equal(h.writes.length,0);});
for(const [format,mime]of [['jpeg','image/jpeg'],['png','image/png'],['webp','image/webp'],['gif','image/gif'],['avif','image/avif']])test('authorized real image content '+format,async()=>{
 const bytes=await sharp({create:{width:2,height:2,channels:3,background:'red'}}).toFormat(format).toBuffer();
 for(const role of ['SUPER_ADMIN','ADMIN','PRODUCT_MANAGER']){const h=upload(role);assert.equal((await h.post(new TestFile(mime,bytes.length,bytes))).status,201);assert.equal(h.writes.length,2);assert.deepEqual(h.writes[1][1],bytes);}
 const h=upload('ADMIN');assert.equal((await h.post(new TestFile(mime,Math.floor(bytes.length/2),bytes.subarray(0,Math.floor(bytes.length/2))))).status,400);assert.equal(h.writes.length,0);
});
test('reject mismatched MIME, SVG, and HTML content without writes',async()=>{
 const jpeg=await sharp({create:{width:1,height:1,channels:3,background:'red'}}).jpeg().toBuffer();
 for(const bytes of [jpeg,Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>'),Buffer.from('<html>Sudha Collections</html>')]){const h=upload('ADMIN');assert.equal((await h.post(new TestFile('image/png',bytes.length,bytes))).status,400);assert.equal(h.writes.length,0);}
});
test('decoded pixel ceiling rejects oversized image dimensions',async()=>{const bytes=await sharp({create:{width:5001,height:5000,channels:3,background:'red'}}).png().toBuffer();const h=upload('ADMIN');assert.equal((await h.post(new TestFile('image/png',bytes.length,bytes))).status,400);assert.equal(h.writes.length,0);});
test('signed session verification rejects tampered and expired tokens before database reads',async()=>{
 const jose=await import('jose');const secret='SC-isolated-session-secret';let reads=0,token;
 const config={SESSION_COOKIE_NAME:'sudha_collections_session_user',SESSION_DURATION_SECONDS:3600};
 const prisma={user:{findUnique:async()=>{reads++;return{id:'SC-actor',role:'ADMIN',status:'ACTIVE'};}}};
 const auth=load('lib/auth.ts',{'./session-config':config,bcryptjs:{},jose,'@/lib/db':{prisma}},{process:{env:{AUTH_SECRET:secret}},TextEncoder});
 const guard=load('lib/admin-authorization.ts',{'next/headers':{cookies:async()=>({get:()=>({value:token})})},'@/lib/auth':auth,'@/lib/db':{prisma},'@/lib/session-config':config,'@/lib/permissions':permissions});
 const valid=await new jose.SignJWT({id:'SC-actor',role:'ADMIN'}).setProtectedHeader({alg:'HS256'}).setExpirationTime('1h').sign(new TextEncoder().encode(secret));
 const expired=await new jose.SignJWT({id:'SC-actor',role:'ADMIN'}).setProtectedHeader({alg:'HS256'}).setExpirationTime(0).sign(new TextEncoder().encode(secret));
 for(token of [undefined,'tampered',valid.slice(0,-8)+'XXXXXXXX',expired])await assert.rejects(()=>guard.requireAdminPermission('update_orders'),e=>e.status===401);
 assert.equal(reads,0);token=valid;await guard.requireAdminPermission('update_orders');assert.equal(reads,1);
});
for(const format of ['gif','webp'])test('animated '+format+' retains every original byte',async()=>{
 const pixels=Buffer.from([255,0,0,0,255,0]);
 const bytes=await sharp(pixels,{raw:{width:1,height:2,channels:3,pageHeight:1}}).toFormat(format).toBuffer();
 const metadata=await sharp(bytes,{animated:true}).metadata();assert.equal(metadata.pages,2);
 const h=upload('PRODUCT_MANAGER');assert.equal((await h.post(new TestFile('image/'+format,bytes.length,bytes))).status,201);assert.deepEqual(h.writes[1][1],bytes);
});
test('database authorization failure fails closed before upload parsing',async()=>{
 let parsed=0,writes=0;
 const guard=load('lib/admin-authorization.ts',{'next/headers':{cookies:async()=>({get:()=>({value:'SC-token'})})},'@/lib/auth':{verifySessionToken:async()=>({id:'SC-actor',role:'ADMIN'})},'@/lib/db':{prisma:{user:{findUnique:async()=>{throw Error('Unavailable');}}}},'@/lib/session-config':{SESSION_COOKIE_NAME:'sudha_collections_session_user'},'@/lib/permissions':permissions});
 const route=load('app/api/admin/product-images/route.ts',{'@/lib/admin-authorization':guard,'@/lib/permissions':permissions,'@/lib/product-image-validation':imageValidation,crypto:{},'fs/promises':{mkdir:async()=>writes++,writeFile:async()=>writes++},path:{},'next/server':{NextResponse:{json:(body,options)=>({body,status:options.status})}}});
 assert.equal((await route.POST({formData:async()=>{parsed++;throw Error('Must not parse');}})).status,500);assert.equal(parsed,0);assert.equal(writes,0);
});
// Phase 2B: real lifecycle code with rollback and serialized order-lock simulation.
for(const [from,to] of [['CONFIRMED','PROCESSING'],['PROCESSING','PACKED'],['PACKED','SHIPPED'],['SHIPPED','OUT_FOR_DELIVERY'],['SHIPPED','DELIVERED'],['OUT_FOR_DELIVERY','DELIVERED']])test(`approved transition ${from} -> ${to}`,async()=>{
 const h=lifecycle(true,false,from);if(['SHIPPED','OUT_FOR_DELIVERY'].includes(from)){h.row.inventoryCommittedAt=new Date();h.state.inventory.reservedStock=0;}
 const r=await h.api.updateOrderFulfillment('SC-order',to,'SC-admin','SC-AWB');assert.equal(r.changed,true);assert.equal(h.row.status,to);assert.equal(h.row.trackingNumber,'SC-AWB');assert.equal(h.state.inventory.availableStock,3);assert.equal(h.state.stock,3);assert.equal(h.state.audits.length,1);
 if(to==='SHIPPED'){assert.equal(h.state.inventory.reservedStock,0);assert.ok(h.row.inventoryCommittedAt);await h.api.updateOrderFulfillment('SC-order',to,'SC-admin','SC-AWB');assert.equal(h.state.audits.length,1);assert.equal(h.state.inventory.reservedStock,0);}
});
for(const [from,to]of [['PENDING','CONFIRMED'],['CONFIRMED','SHIPPED'],['PROCESSING','CONFIRMED'],['DELIVERED','SHIPPED'],['DELIVERED','RETURNED'],['CANCELLED','PROCESSING'],['REFUNDED','PENDING'],['CONFIRMED','REFUNDED']])test(`service rejects transition ${from} -> ${to}`,async()=>{const h=lifecycle(true,false,from);await assert.rejects(()=>h.api.updateOrderFulfillment('SC-order',to,'SC-admin'));assert.equal(h.writes.length,0);});
for(const change of [h=>h.row.paymentStatus='PENDING',h=>h.row.inventoryReleasedAt=new Date(),h=>h.state.payments[0].refundedPaise=1,h=>h.state.refund={status:'FAILED'},h=>h.state.payments[0].amountPaise=1])test('fulfillment rejects inconsistent financial or inventory state '+change.toString(),async()=>{const h=lifecycle();change(h);await assert.rejects(()=>h.api.updateOrderFulfillment('SC-order','PROCESSING','SC-admin'));assert.equal(h.writes.length,0);});
test('shipping rolls back if reservation is insufficient',async()=>{const h=lifecycle(true,false,'PACKED');h.state.inventory.reservedStock=1;await assert.rejects(()=>h.api.updateOrderFulfillment('SC-order','SHIPPED','SC-admin'));assert.equal(h.row.status,'PACKED');assert.equal(h.writes.length,0);assert.equal(h.row.inventoryCommittedAt,null);});
test('shipping and cancellation serialize to one valid outcome',async()=>{
 for(const cancelFirst of [true,false]){const h=lifecycle(true,false,'PACKED');const cancel=()=>h.api.cancelOrder('SC-order',{userId:'SC-admin',admin:true},'Sudha Collections test');const ship=()=>h.api.updateOrderFulfillment('SC-order','SHIPPED','SC-admin');const result=await Promise.allSettled(cancelFirst?[cancel(),ship()]:[ship(),cancel()]);assert.equal(result.filter(r=>r.status==='fulfilled').length,1);assert.equal(h.row.status,cancelFirst?'CANCELLED':'SHIPPED');assert.equal(h.state.inventory.availableStock,cancelFirst?5:3);assert.equal(h.state.inventory.reservedStock,0);assert.equal(!!h.state.refund,cancelFirst);}
});
for(const paid of [false,true])test('concurrent duplicate cancellation restores and queues once paid='+paid,async()=>{const h=lifecycle(paid,false,paid?'CONFIRMED':'PENDING');const results=await Promise.all(Array.from({length:4},()=>h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test')));assert.equal(results.filter(r=>r.cancellationChanged).length,1);assert.equal(h.state.inventory.availableStock,5);assert.equal(h.state.stock,5);assert.equal(h.state.coupon,0);assert.equal(h.state.audits.length,1);assert.equal(h.writes.filter(w=>w.model==='paymentRefund').length,paid?1:0);});
for(const mutate of [h=>h.state.payments=[],h=>h.state.payments[0].transactionId=null,h=>h.state.payments[0].amountPaise=null,h=>h.state.payments[0].amountPaise=1,h=>h.state.payments[0].currency='USD',h=>h.state.payments[0].status='PENDING',h=>h.state.payments[0].provider='STRIPE',h=>h.state.payments[0].refundedPaise=9000,h=>h.state.payments.push({...h.state.payments[0],id:'SC-extra'})])test('paid cancellation rejects inconsistent records '+mutate.toString(),async()=>{const h=lifecycle();mutate(h);await assert.rejects(()=>h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test'),/inconsistent/);assert.equal(h.writes.length,0);assert.equal(h.row.status,'CONFIRMED');assert.equal(h.state.coupon,1);});
test('audit failure rolls back cancellation, stock, coupon and refund',async()=>{const h=createOrderHarness(load,{failAudit:true});await assert.rejects(()=>h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test'));assert.equal(h.row.status,'CONFIRMED');assert.equal(h.state.inventory.availableStock,3);assert.equal(h.state.coupon,1);assert.equal(h.state.refund,null);assert.equal(h.writes.length,0);});
test('partial prior refund queues only remainder and completes through verified refund response',async()=>{const h=lifecycle();h.state.payments[0].refundedPaise=1000;await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test');assert.equal(h.state.refund.amountPaise,8000);assert.equal(h.row.paymentStatus,'PAID');await h.api.processRefund('SC-refund');assert.equal(h.row.paymentStatus,'REFUNDED');assert.equal(h.row.status,'REFUNDED');assert.equal(h.state.payments[0].refundedPaise,9000);assert.equal(h.requests.length,1);await h.api.processRefund('SC-refund');assert.equal(h.requests.length,1);});
test('duplicate refund requests retain one refund body, key and audit',async()=>{const h=lifecycle();await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test');const original=structuredClone(h.state.refund),audits=h.state.audits.length;await Promise.all([h.api.requestOrderRefund('SC-order','SC-admin','SC retry'),h.api.requestOrderRefund('SC-order','SC-admin','SC retry')]);assert.deepEqual(h.state.refund,original);assert.equal(h.state.audits.length,audits);});
test('failed refund is not silently requeued or reported successful',async()=>{const h=lifecycle();await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test');h.state.refund.status='FAILED';const n=h.writes.length;await assert.rejects(()=>h.api.requestOrderRefund('SC-order','SC-admin','SC retry'));await assert.rejects(()=>h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'SC retry'));assert.equal(h.writes.length,n);assert.equal(h.row.paymentStatus,'PAID');});
for(const captureFirst of [true,false])test('capture and cancellation serialized ordering captureFirst='+captureFirst,async()=>{
 const h=lifecycle(false,false,'PENDING');h.state.payments[0].transactionId=null;
 const capture=()=>h.checkout.applyPayment({id:'SC-TXN',order_id:'SC-gateway',amount:9000,currency:'INR',status:'captured',captured:true});
 const cancel=()=>h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test');
 await Promise.all(captureFirst?[capture(),cancel()]:[cancel(),capture()]);
 assert.equal(h.row.status,'CANCELLED');assert.equal(h.row.paymentStatus,'PAID');assert.equal(h.state.stock,5);assert.equal(h.state.inventory.reservedStock,0);assert.equal(h.state.coupon,0);assert.equal(h.writes.filter(w=>w.model==='paymentRefund'&&w.method==='upsert').length,1);
 await capture();assert.equal(h.row.status,'CANCELLED');assert.equal(h.state.stock,5);
});
test('refund callbacks re-read under lock and cannot regress a processed refund',async()=>{
 const h=lifecycle();await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'Sudha Collections test');h.state.refund.gatewayRefundId='SC-gateway-refund';
 const response={id:'SC-gateway-refund',payment_id:'SC-TXN',amount:9000,currency:'INR',status:'processed'};
 await Promise.all([h.api.applyRefund(response),h.api.applyRefund(response),h.api.applyRefund({...response,status:'pending'})]);
 assert.equal(h.row.status,'REFUNDED');assert.equal(h.state.refund.status,'PROCESSED');assert.equal(h.writes.filter(w=>w.model==='payment'&&w.args.data.status==='REFUNDED').length,1);
});
test('refund response identity or amount mismatch cannot mark refunded',async()=>{for(const wrong of [{payment_id:'SC-wrong'},{amount:1},{currency:'USD'}]){const h=lifecycle();await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'SC cancel');h.state.refund.gatewayRefundId='SC-gateway-refund';await assert.rejects(()=>h.api.applyRefund({id:'SC-gateway-refund',payment_id:'SC-TXN',amount:9000,status:'processed',currency:'INR',...wrong}));assert.equal(h.row.paymentStatus,'PAID');assert.equal(h.state.refund.status,'REQUESTED');}});
test('lost refund response retries the original idempotency key and body',async()=>{const h=createOrderHarness(load,{gateway:(path,body,headers,count)=>{if(count===1)throw Error('Lost response');return{id:'SC-gateway-refund',payment_id:'SC-TXN',amount:9000,currency:'INR',status:'processed'};}});await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'SC cancel');await h.api.processRefund('SC-refund');assert.equal(h.row.paymentStatus,'PAID');await h.api.processRefund('SC-refund');assert.deepEqual(h.requests[0],h.requests[1]);assert.equal(h.row.paymentStatus,'REFUNDED');});
test('action sends one cancellation email on repeated valid cancellation',async()=>{const h=actions('ORDER_MANAGER');for(let i=0;i<2;i++)assert.equal((await h.order.updateOrderStatusAction('SC-order','CANCELLED')).success,true);assert.equal(h.emails.length,1);assert.equal(h.writes.filter(w=>w.model==='coupon').length,1);});
test('action validates unknown statuses before mutation',async()=>{for(const status of ['BOGUS',null,{},1]){const h=actions('ADMIN');assert.equal((await h.order.updateOrderStatusAction('SC-order',status)).success,false);assert.equal(h.writes.length,0);}});
test('existing returned orders can queue a refund without restocking uninspected returns',async()=>{const h=lifecycle(true,true,'RETURNED');await h.api.requestOrderRefund('SC-order','SC-admin','SC return refund');assert.equal(h.state.refund.amountPaise,9000);assert.equal(h.state.stock,3);assert.equal(h.state.coupon,1);assert.equal(h.row.paymentStatus,'PAID');});
test('unexpired and already-paid checkout expiry calls do not cancel',async()=>{const h=lifecycle(false,false,'PENDING');h.row.expiresAt=new Date(Date.now()+60000);await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'SC expiry',true);assert.equal(h.writes.length,0);const paid=lifecycle();await paid.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'SC dismiss',false,true);assert.equal(paid.writes.length,0);});
test('refund processor flags inconsistent payment and makes no gateway call',async()=>{const h=lifecycle();await h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'SC cancel');h.state.payments[0].transactionId=null;await h.api.processRefund('SC-refund');assert.equal(h.requests.length,0);assert.equal(h.row.paymentStatus,'PAID');assert.match(h.state.refund.lastError,/inconsistent/);});
test('legacy cancellation missing inventory release is rejected without attempting an automatic repair',async()=>{const h=lifecycle(true,false,'CANCELLED');await assert.rejects(()=>h.api.cancelOrder('SC-order',{userId:'SC-owner',admin:false},'SC retry'),/incomplete inventory/);assert.equal(h.writes.length,0);});
// Phase 2C: seed functions receive only in-memory clients. CLI entry points are never executed.
const seedPolicy=load('prisma/seed-policy.ts',{}, {URL});
const seedReference=load('prisma/seed-reference.ts');
const seedRunner=load('prisma/seed-runner.ts',{'./seed-policy':seedPolicy,'./seed-reference':seedReference});
function referenceClient(){
 const rows=new Map([['pure-silk-sarees',{id:'SC-existing',slug:'pure-silk-sarees',name:'Sudha Collections custom category',status:'INACTIVE',displayOrder:97}]]);
 const client={$disconnect:async()=>{},$transaction:async fn=>fn({category:{upsert:async({where,update,create})=>{assert.deepEqual(Object.keys(update),[]);if(!rows.has(where.slug))rows.set(where.slug,{id:'SC-category-'+rows.size,...create});return rows.get(where.slug);}}})};
 return{client,rows};
}
test('canonical homepage and layouts preserve the Phase 2C starting content byte-for-byte',()=>{const hashes=require('./helpers/homepage-preservation.json'),{createHash}=require('node:crypto');for(const[file,hash]of Object.entries(hashes))assert.equal(createHash('sha256').update(fs.readFileSync(file)).digest('hex'),hash,file);});
test('only the canonical page resolves to the root, including nested route groups',()=>{
 const rootPages=[];
 function walk(dir,segments=[]){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.isDirectory())walk(dir+'/'+entry.name,[...segments,entry.name]);else if(/^page\.(tsx|ts|jsx|js)$/.test(entry.name)&&segments.filter(p=>!/^\(.*\)$/.test(p)).length===0)rootPages.push(dir+'/'+entry.name);}}
 walk('app');assert.deepEqual(rootPages,['app/(store)/page.tsx']);
 const home=fs.readFileSync(rootPages[0],'utf8'),layout=fs.readFileSync('app/(store)/layout.tsx','utf8');
 assert.match(home,/export const revalidate = 60/);for(const component of ['HeroCarousel','PromoBannerCarousel','CollectionEdit','ProductCard','SpinToWin'])assert.ok(home.includes(component));assert.match(layout,/<Header /);assert.match(layout,/<Footer/);assert.match(fs.readFileSync('app/layout.tsx','utf8'),/Sudha Collections/);
});
test('production seed is reference-only, idempotent and preserves existing data',async()=>{
 const h=referenceClient();const original=structuredClone(h.rows.get('pure-silk-sarees'));let devLoads=0;
 for(let i=0;i<2;i++){await seedRunner.runSeed({NODE_ENV:'production'},()=>h.client,async()=>{devLoads++;throw Error('Production must never load fixtures');});if(i===0)h.firstSize=h.rows.size;}
 assert.equal(devLoads,0);assert.equal(h.rows.size,h.firstSize);assert.ok(h.rows.size>1);assert.deepEqual(h.rows.get('pure-silk-sarees'),original);
});
const devEnv={NODE_ENV:'development',SUDHA_COLLECTIONS_SEED_MODE:'development',SUDHA_COLLECTIONS_ALLOW_DEV_FIXTURES:'true',SUDHA_COLLECTIONS_DEV_DATABASE_URL:'postgresql://fixture:unused@localhost/sudha_collections_test_isolated',DATABASE_URL:'postgresql://app:unused@localhost/sudha_collections'};
for(const overrides of [{NODE_ENV:'production'},{NODE_ENV:undefined},{SUDHA_COLLECTIONS_ALLOW_DEV_FIXTURES:undefined},{SUDHA_COLLECTIONS_DEV_DATABASE_URL:undefined},{SUDHA_COLLECTIONS_DEV_DATABASE_URL:'postgresql://fixture:unused@localhost/production'},{DATABASE_URL:'postgresql://other:unused@localhost:5432/sudha_collections_test_isolated?schema=public'},{SUDHA_COLLECTIONS_SEED_MODE:'unknown'}])test('fixture mode fails closed '+Object.keys(overrides).join(','),async()=>{let constructed=0;await assert.rejects(()=>seedRunner.runSeed({...devEnv,...overrides},()=>{constructed++;throw Error('Client must not be constructed');}));assert.equal(constructed,0);});
test('explicit development opt-in selects only the separate fixture URL',async()=>{let target,called=0;const client={$disconnect:async()=>{}};await seedRunner.runSeed(devEnv,url=>{target=url;return client;},async()=>({seedDevelopmentData:async(db,env)=>{assert.equal(db,client);assert.equal(env,devEnv);called++;}}));assert.equal(target,devEnv.SUDHA_COLLECTIONS_DEV_DATABASE_URL);assert.equal(called,1);});
test('direct development fixture calls also reject production before data access',async()=>{const fixtures=load('prisma/seed-development.ts',{'@prisma/client':{},bcryptjs:{},'node:crypto':{},'./seed-policy':seedPolicy});await assert.rejects(()=>fixtures.seedDevelopmentData({}, {...devEnv,NODE_ENV:'production'}),/explicit opt-in/);});
test('seed sources contain no privileged fixtures, fixed password hashes or destructive collection calls',()=>{
 for(const file of ['prisma/seed.ts','prisma/seed-development.ts','prisma/seed-reference.ts','prisma/seed-runner.ts']){const s=fs.readFileSync(file,'utf8');assert.equal(/bcrypt\.hash\(["']/.test(s),false,file);assert.equal(/SUPER_ADMIN|role:\s*["']ADMIN|collection\.(delete|deleteMany)/.test(s),false,file);assert.equal(/Demo Admin:|Demo Customer:/.test(s),false,file);}
 assert.equal(JSON.parse(fs.readFileSync('package.json','utf8')).prisma.seed,'npx tsx prisma/seed.ts');
});
function provisioning(){let writes=0,hashCalls=0,existing=null;const api=load('prisma/provision-admin.ts',{bcryptjs:{hash:async(secret,cost)=>{assert.equal(cost,12);hashCalls++;return'SC-test-hash';}}},{Buffer});const client={$transaction:async fn=>fn({$executeRaw:async()=>{},user:{findFirst:async()=>existing,create:async({data})=>{assert.equal(data.role,'SUPER_ADMIN');assert.equal(data.passwordHash,'SC-test-hash');writes++;existing={id:'SC-admin'};}}})};return{api,client,get writes(){return writes;},get hashCalls(){return hashCalls;},set existing(value){existing=value;}};}
test('initial administrator requires opt-in and a separately supplied strong secret',async()=>{for(const env of [{},{SUDHA_COLLECTIONS_PROVISION_ADMIN:'true'},{SUDHA_COLLECTIONS_PROVISION_ADMIN:'true',SUDHA_COLLECTIONS_ADMIN_EMAIL:'owner@sudha.test',SUDHA_COLLECTIONS_ADMIN_PASSWORD:'short'}]){const h=provisioning();await assert.rejects(()=>h.api.provisionInitialAdministrator(h.client,env));assert.equal(h.hashCalls,0);assert.equal(h.writes,0);}});
test('initial administrator creation never overwrites an existing administrator or account',async()=>{const env={SUDHA_COLLECTIONS_PROVISION_ADMIN:'true',SUDHA_COLLECTIONS_ADMIN_EMAIL:'owner@sudha.test',SUDHA_COLLECTIONS_ADMIN_PASSWORD:require('node:crypto').randomBytes(32).toString('base64url')};const h=provisioning();await h.api.provisionInitialAdministrator(h.client,env);assert.equal(h.writes,1);await assert.rejects(()=>h.api.provisionInitialAdministrator(h.client,env),/already exists/);assert.equal(h.writes,1);const match=provisioning();match.existing={id:'SC-customer'};await assert.rejects(()=>match.api.provisionInitialAdministrator(match.client,env));assert.equal(match.writes,0);});
