const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const output={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/lib/salesInsights.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:output});
const {partSalesInsights,vehicleSalesInsights}=output;
const parts=[{id:'a',name:'Aceite',code:'A',stock_total:2,min_stock:3},{id:'b',name:'Filtro',code:'B',stock_total:10,min_stock:1}];
const sale=(status,document='V-1',amount=116)=>({status,client_name:'María',client_document:document,total_with_taxes:amount,lines:[{part_id:'a',quantity:2,dispatched_quantity:2,line_total:60},{part_id:'b',quantity:1,dispatched_quantity:null,line_total:40}]});
test('sales rankings exclude cancelled, pending and requested transactions',()=>{
 const result=partSalesInsights([sale('completado'),sale('cancelado'),sale('pendiente'),sale('pedido')],parts);
 assert.equal(result.count,1);assert.equal(result.total,116);assert.equal(result.units,3);assert.equal(result.products[0].name,'Aceite');assert.equal(result.products[0].units,2);assert.equal(result.products[0].amount,60);assert.equal(result.average,116);
});
test('repeat clients use normalized documents, keeping namesakes distinct',()=>{
 const result=partSalesInsights([sale('completado'),sale('completado','v 1'),sale('completado','V2',200)],parts);
 assert.equal(result.clients,2);assert.equal(result.repeatClients,1);assert.equal(result.topClients[0].purchases,2);assert.equal(result.topClients[0].amount,232);
});
test('aggregated rankings use quantity first and retain real stock signals',()=>{
 const result=partSalesInsights([sale('completado'),sale('completado')],parts);
 assert.equal(result.products[0].units,4);assert.equal(result.products[0].stock,2);assert.equal(result.products[0].minStock,3);assert.equal(result.products[1].units,2);
});
test('empty selections produce zeros rather than invalid averages',()=>{
 const result=partSalesInsights([],parts);assert.equal(result.average,0);assert.equal(result.total,0);assert.equal(result.topClients.length,0);assert.equal(result.products.length,0);
});
test('vehicle rankings group models and preserve distinct customer documents',()=>{
 const result=vehicleSalesInsights([{vehicle_id:'1',client_name:'A',client_document:'J1',final_price:20000},{vehicle_id:'2',client_name:'B',client_document:'J2',final_price:22000}],[{id:'1',brand:'Toyota',model:'Hilux'},{id:'2',brand:'Toyota',model:'Hilux'}]);
 assert.equal(result.total,42000);assert.equal(result.average,21000);assert.equal(result.products.length,1);assert.equal(result.products[0].units,2);assert.equal(result.clients,2);
});
