const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const assert=require('node:assert/strict');const {test}=require('node:test');
function load(file,deps,globals={}){const ctx={exports:{},console,Date,...globals,require:n=>{if(!(n in deps))throw Error('Unexpected import '+n);return deps[n]}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText,ctx);return ctx.exports;}
const confirmation=load('lib/payments/confirmation.client.ts',{});
async function runCheckout(mode){
 let checks=0,verification=0,cancellations=0;
 const actions={cancelCheckoutAction:async()=>{cancellations++;return {success:true,status:mode==='cancel'?'PENDING':'PAID'};},preparePaymentAction:async()=>({success:true,checkout:{paid:false,mock:false,keyId:'test',gatewayOrderId:'order_fixture',amount:10000,currency:'INR',name:'Test',contact:''}}),
 paymentStatusAction:async()=>({success:true,status:++checks===1?'PENDING':'PAID'}),verifyPaymentAction:async()=>{verification++;if(mode==='lost-response')throw Error('Connection lost');return {success:true,status:'PAID'};}};
 const window={Razorpay:class{constructor(options){this.options=options;}open(){if(mode==='dismiss'||mode==='cancel')void this.options.modal.ondismiss();else void this.options.handler({razorpay_order_id:'order_fixture',razorpay_payment_id:'pay_fixture',razorpay_signature:'a'.repeat(64)});}}};
 const client=load('lib/payments/checkout.client.ts',{'@/lib/payments/checkout-api.client':actions,'./confirmation.client':{confirmCheckoutPayment:(verify,status)=>confirmation.confirmCheckoutPayment(verify,status,async()=>{})}},{window});
 assert.equal(await client.openOrderPayment('cmu2giz3b0003gaygsyuzj0t8'),mode!=='cancel');
 assert.equal(verification,mode==='dismiss'||mode==='cancel'?0:1);
 assert.equal(cancellations,mode==='dismiss'||mode==='cancel'?1:0);
}
test('unpaid payment dismissal cancels checkout and returns false',()=>runCheckout('cancel'));
test('verified Razorpay callback permits thank-you navigation',()=>runCheckout('success'));
test('lost callback response recovers through authenticated status',()=>runCheckout('lost-response'));
test('gateway close without callback still recovers captured payment',()=>runCheckout('dismiss'));
test('capture updates payment and order atomically; authorization alone stays pending',async()=>{
 let notifications=0;
 const state={payment:'PENDING',order:'PENDING',fulfilment:'PENDING'};
 const record={id:'payment',orderId:'order',provider:'RAZORPAY',amountPaise:10000,currency:'INR',transactionId:null,refundedPaise:0};
 const tx={orderItem:{findMany:async()=>[]},$executeRaw:async()=>{},payment:{findUnique:async()=>record,findUniqueOrThrow:async()=>({...record,status:state.payment,order:{status:state.fulfilment,paymentStatus:state.order,expiresAt:null}}),update:async({data})=>{state.payment=data.status;}},order:{update:async({data})=>{state.order=data.paymentStatus;state.fulfilment=data.status;}}};
 const service=load('lib/payments/checkout.service.ts',{'./order-notifications.service':{sendPaidOrderNotifications:async()=>{notifications++;}},'./lifecycle.service':{},'@/lib/db':{prisma:{$transaction:async f=>f(tx)}},zod:require('zod'),'./razorpay':{}});
 const payment={id:'pay_fixture',order_id:'order_fixture',amount:10000,currency:'INR',status:'authorized',captured:false};
 assert.equal(await service.applyPayment(payment),'PENDING');assert.equal(state.payment,'PENDING');assert.equal(notifications,0);
 assert.equal(await service.applyPayment({...payment,status:'captured',captured:true}),'PAID');assert.deepEqual(state,{payment:'PAID',order:'PAID',fulfilment:'CONFIRMED'});
 assert.equal(await service.applyPayment({...payment,status:'captured',captured:true}),'PAID');
 assert.equal(notifications,1);
 await assert.rejects(()=>service.applyPayment({...payment,amount:1,status:'captured',captured:true}),/amount or currency mismatch/);
});
