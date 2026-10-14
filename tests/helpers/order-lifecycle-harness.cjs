// Sudha Collections: in-memory transaction harness. Never imports a database client.
module.exports = function createOrderHarness(load, options = {}) {
 const writes = options.writes || [], notifications = [], requests = [];
 const order = Object.assign(options.order || {}, { ...{
  id:'SC-order',userId:'SC-owner',orderNumber:'SC-TEST',status:'CONFIRMED',paymentStatus:'PAID',paymentMethod:'ONLINE',total:90,
  inventoryReleasedAt:null,inventoryCommittedAt:null,trackingNumber:null,couponCode:'SC-COUPON',expiresAt:null,
  user:{name:'Sudha Collections',email:'sc@example.invalid'},items:[{variantId:'SC-variant',quantity:2,productName:'Sudha Collections',sku:'SC-V',totalPrice:90}],
 }, ...options.order });
 const state={order,payments:[{id:'SC-payment',orderId:order.id,provider:'RAZORPAY',transactionId:'SC-TXN',gatewayOrderId:'SC-gateway',currency:'INR',amountPaise:9000,amount:90,refundedPaise:0,status:order.paymentStatus}],
  inventory:{availableStock:3,reservedStock:2},stock:3,coupon:1,refund:null,audits:[]};
 const copy=v=>structuredClone(v),record=(model,method,args)=>writes.push({model,method,args:copy(args)});
 const details=()=>({...copy(state.order),payments:copy(state.payments)});
 const mutate=(target,data)=>{for(const[k,v]of Object.entries(data)){if(v&&typeof v==='object'&&'increment'in v)target[k]+=v.increment;else if(v&&typeof v==='object'&&'decrement'in v)target[k]-=v.decrement;else target[k]=v;}};
 const tx={
  order:{findUnique:async()=>details(),findUniqueOrThrow:async()=>details(),update:async args=>{record('order','update',args);mutate(state.order,args.data);return details();}},
  inventory:{findUnique:async()=>state.inventory&&copy(state.inventory),updateMany:async args=>{
   if(!state.inventory||state.inventory.reservedStock<(args.where.reservedStock?.gte||0))return{count:0};
   record('inventory','updateMany',args);mutate(state.inventory,args.data);return{count:1};}},
  productVariant:{update:async args=>{record('productVariant','update',args);state.stock+=args.data.stock.increment||0;}},
  coupon:{updateMany:async args=>{if(state.coupon<=0)return{count:0};record('coupon','updateMany',args);state.coupon--;return{count:1};}},
  payment:{findUnique:async({where})=>copy(state.payments.find(p=>where.id?p.id===where.id:p.gatewayOrderId===where.gatewayOrderId)||null),
   findUniqueOrThrow:async({where,include})=>{const p=state.payments.find(p=>p.id===where.id);if(!p)throw Error('No payment');return{...copy(p),...(include?.order?{order:copy(state.order)}:{})};},
   update:async args=>{record('payment','update',args);const p=state.payments.find(p=>p.id===args.where.id);mutate(p,args.data);return copy(p);}},
  paymentRefund:{findUnique:async({where})=>state.refund&&(!where.gatewayRefundId||where.gatewayRefundId===state.refund.gatewayRefundId)?{...copy(state.refund),payment:copy(state.payments[0])}:null,
   findUniqueOrThrow:async()=>{if(!state.refund)throw Error('No refund');return{...copy(state.refund),payment:copy(state.payments[0])};},
   findFirst:async()=>state.refund&&copy(state.refund),
   upsert:async args=>{if(!state.refund){record('paymentRefund','upsert',args);state.refund={id:'SC-refund',idempotencyKey:'SC-key',gatewayRefundId:null,status:'REQUESTED',attempts:0,...copy(args.create)};}return copy(state.refund);},
   update:async args=>{record('paymentRefund','update',args);mutate(state.refund,args.data);return copy(state.refund);},
   updateMany:async args=>{if(args.where?.status?.in && !args.where.status.in.includes(state.refund?.status))return{count:0};if(state.refund){record('paymentRefund','updateMany',args);mutate(state.refund,args.data);}return{count:state.refund?1:0};}},
  auditLog:{create:async args=>{record('auditLog','create',args);if(options.failAudit)throw Error('SC injected audit failure');state.audits.push(copy(args.data));}},
  orderItem:{findMany:async()=>copy(state.order.items)},cartItem:{deleteMany:async()=>({count:0}),updateMany:async()=>({count:0})},
 };
 let tail=Promise.resolve();
 const prisma={...tx,$transaction:async fn=>{
  let release, snapshot, writeCount;const transaction={...tx,$executeRaw:async(strings,key)=>{
   if(key!==state.order.id)throw Error('Wrong advisory lock key');
   const previous=tail;tail=new Promise(r=>release=r);await previous;snapshot=copy(state);writeCount=writes.length;
  }};
  try{return await fn(transaction);}catch(e){if(snapshot){for(const k of Object.keys(state.order))delete state.order[k];Object.assign(state.order,snapshot.order);for(const k of Object.keys(snapshot))if(k!=='order')state[k]=snapshot[k];writes.length=writeCount;}throw e;}finally{release?.();}
 }};
 const zod=require('zod');const policy=load('lib/order-status-policy.ts');
 const gateway={paymentConfig:()=>({provider:'MOCK'}),razorpayRequest:async(path,body,headers)=>{
  requests.push({path,body,headers});if(options.gateway) return options.gateway(path,body,headers,requests.length);
  return{id:'SC-gateway-refund',payment_id:'SC-TXN',amount:state.refund.amountPaise,currency:'INR',status:'processed'};
 }};
 const api=load('lib/payments/lifecycle.service.ts',{'@prisma/client':{},'@/lib/db':{prisma},zod,'./razorpay':gateway,'@/lib/order-status-policy':policy});
 const checkout=load('lib/payments/checkout.service.ts',{'@/lib/db':{prisma},zod,'./razorpay':{},'./lifecycle.service':api,'./order-notifications.service':{sendPaidOrderNotifications:async id=>notifications.push(id)}});
 return{state,row:state.order,writes,api,checkout,requests,notifications,prisma,policy};
};
