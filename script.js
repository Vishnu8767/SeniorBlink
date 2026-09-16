const KEY="seniorblink_v1";
const defaultData={
  user:null, users:[], cart:[], orders:[], activity:[], favorites:[], settings:{notifications:true,language:"English"}
};
let db=JSON.parse(localStorage.getItem(KEY)||"null")||structuredClone(defaultData);
function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function log(action,details=""){db.activity.unshift({action,details,time:new Date().toLocaleString()});db.activity=db.activity.slice(0,100);save()}
function money(n){return "₹"+Number(n).toFixed(2)}
const products=[
{id:1,name:"Fresh Bananas",cat:"Fruits & Vegetables",price:49,unit:"1 kg",emoji:"🍌",desc:"Fresh and naturally ripened bananas."},
{id:2,name:"Whole Wheat Bread",cat:"Bakery & Breads",price:55,unit:"400 g",emoji:"🍞",desc:"Soft whole wheat bread for breakfast."},
{id:3,name:"Red Apples",cat:"Fruits & Vegetables",price:129,unit:"1 kg",emoji:"🍎",desc:"Crisp and fresh red apples."},
{id:4,name:"Milk",cat:"Dairy & Eggs",price:68,unit:"1 L",emoji:"🥛",desc:"Fresh dairy milk."},
{id:5,name:"Eggs",cat:"Dairy & Eggs",price:90,unit:"12 pcs",emoji:"🥚",desc:"Farm fresh eggs."},
{id:6,name:"Cheddar Cheese",cat:"Dairy & Eggs",price:210,unit:"200 g",emoji:"🧀",desc:"Mild and creamy cheddar cheese."},
{id:7,name:"Rice",cat:"Staples",price:280,unit:"5 kg",emoji:"🍚",desc:"Quality everyday rice."},
{id:8,name:"Toor Dal",cat:"Staples",price:170,unit:"1 kg",emoji:"🫘",desc:"Protein-rich toor dal."},
{id:9,name:"Tea",cat:"Snacks & Beverages",price:145,unit:"250 g",emoji:"🍵",desc:"Aromatic everyday tea."},
{id:10,name:"Biscuits",cat:"Snacks & Beverages",price:45,unit:"300 g",emoji:"🍪",desc:"Light and crunchy biscuits."},
{id:11,name:"Bath Soap",cat:"Personal Care",price:38,unit:"1 pc",emoji:"🧼",desc:"Gentle daily-use soap."},
{id:12,name:"Laundry Detergent",cat:"Household Essentials",price:160,unit:"1 kg",emoji:"🧴",desc:"Effective detergent for clothes."}
];
const cats=[["Fruits & Vegetables","🥦"],["Dairy & Eggs","🥛"],["Bakery & Breads","🍞"],["Staples","🍚"],["Snacks & Beverages","🍪"],["Household Essentials","🧴"],["Personal Care","🧼"]];


function openLocation(){
document.body.insertAdjacentHTML("beforeend",`
<div class="modal" id="locationModal" onclick="if(event.target.id==='locationModal')closeLocation()">
<div class="modal-box">
<div class="section-title"><h2>📍 Delivery Location</h2><button class="icon-btn" onclick="closeLocation()">✕</button></div>
<p class="small">Allow location access to detect your current position. SeniorBlink requests high-accuracy location and then fills the address automatically when an address service is available.</p>
<button class="btn btn-primary" style="width:100%;margin-bottom:12px" onclick="detectLocation()">📍 Detect My Current Location</button>
<div id="locationStatus" class="small" style="margin-bottom:12px"></div>
<div class="form-group"><label>Detected / Delivery Address</label><textarea class="form-control" id="manualAddress" rows="4" placeholder="Your detected address will appear here...">${db.user.address||""}</textarea></div>
<div class="row">
<button class="btn btn-outline" onclick="saveManualAddress()">Save Address</button>
<button class="btn btn-primary" onclick="detectLocation()">Use My Location</button>
</div>
</div></div>`);
}

function closeLocation(){document.getElementById("locationModal")?.remove()}

async function detectLocation(){
const status=document.getElementById("locationStatus");
if(!navigator.geolocation){
status.textContent="Location is not supported by this browser. Please enter your address manually.";
return;
}
status.textContent="Requesting location permission…";
navigator.geolocation.getCurrentPosition(async pos=>{
const lat=pos.coords.latitude;
const lon=pos.coords.longitude;
status.textContent=`GPS detected. Accuracy: approximately ${Math.round(pos.coords.accuracy)} metres. Extracting address…`;

let address="";
try{
const response=await fetch(
`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,
{headers:{"Accept":"application/json"}}
);
if(response.ok){
const data=await response.json();
address=data.display_name||"";
}
}catch(err){
console.log("Address lookup unavailable:",err);
}

if(!address){
address=`GPS Location: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

db.user.address=address;
db.user.location={
latitude:lat,
longitude:lon,
accuracyMeters:pos.coords.accuracy,
updatedAt:new Date().toISOString()
};

const u=db.users.find(x=>x.id===db.user.id);
if(u) Object.assign(u,db.user);

log("Delivery location updated",`Accuracy ~${Math.round(pos.coords.accuracy)} m`);
save();

const modalBox=document.getElementById("manualAddress");
if(modalBox) modalBox.value=address;

const checkoutAddress=document.getElementById("address");
if(checkoutAddress) checkoutAddress.value=address;

status.textContent="✓ Address detected and filled automatically.";
},err=>{
const messages={
1:"Location permission was denied. Please allow location access and try again.",
2:"Your location could not be determined. Please try again.",
3:"Location request timed out. Please try again."
};
status.textContent=messages[err.code]||"Could not detect location.";
},{enableHighAccuracy:true,timeout:20000,maximumAge:0});
}

function saveManualAddress(){
const value=document.getElementById("manualAddress")?.value.trim();
if(!value){
alert("Please enter a delivery address.");
return;
}
db.user.address=value;
const u=db.users.find(x=>x.id===db.user.id);
if(u) Object.assign(u,db.user);
log("Delivery address saved");
save();

const checkoutAddress=document.getElementById("address");
if(checkoutAddress) checkoutAddress.value=value;

closeLocation();
if(document.getElementById("homeAddress")) showPage("home");
}

function render(){db.user?renderShop():renderAuth()}
function renderAuth(){
document.getElementById("app").innerHTML=`
<div class="auth"><div class="auth-card">
<div class="auth-logo">🛒 Senior<span style="color:var(--gold)">Blink</span></div>
<p style="text-align:center;color:var(--muted)">Trusted Grocery & Health Delivery</p>
<div class="tabs"><button id="loginTab" class="active" onclick="authMode('login')">Login</button><button id="signupTab" onclick="authMode('signup')">Create Account</button></div>
<div id="authForm"></div>
<p class="small" style="text-align:center;margin-top:20px">Designed for simple, safe and comfortable grocery shopping.</p>
</div></div>`;
authMode("login");
}
function authMode(mode){
document.getElementById("loginTab").classList.toggle("active",mode==="login");
document.getElementById("signupTab").classList.toggle("active",mode==="signup");
document.getElementById("authForm").innerHTML=mode==="login"?`
<form onsubmit="login(event)">
<div class="form-group"><label>Email or phone</label><input class="form-control" id="email" required></div>
<div class="form-group"><label>Password</label><input class="form-control" id="password" type="password" required></div>
<label><input type="checkbox" id="remember" checked> Remember me on this computer</label>
<button class="btn btn-primary" style="width:100%;margin-top:18px">Login</button>
<p style="text-align:center">New here? <button type="button" class="btn" onclick="authMode('signup')" style="padding:2px;color:var(--blue)">Sign up</button></p>
</form>`:`
<form onsubmit="signup(event)">
<div class="form-group"><label>Full name</label><input class="form-control" id="name" required></div>
<div class="form-group"><label>Phone number</label><input class="form-control" id="phone" required></div>
<div class="form-group"><label>Email</label><input class="form-control" id="email" type="email" required></div>
<div class="form-group"><label>Password</label><input class="form-control" id="password" type="password" minlength="6" required></div>
<button class="btn btn-primary" style="width:100%;margin-top:10px">Create Account</button>
<p style="text-align:center">Already registered? <button type="button" class="btn" onclick="authMode('login')" style="padding:2px;color:var(--blue)">Login</button></p>
</form>`;
}
function signup(e){
  e.preventDefault();
  let u={id:Date.now(),name:name.value,phone:phone.value,email:email.value,password:password.value,address:""};
  if(db.users.some(x=>x.email===u.email)){
    alert("You are an existing user! An account with this email already exists. Please log in instead.");
    authMode('login');
    return;
  }
  db.users.push(u);
  db.user=u;
  log("Account created",u.email);
  save();
  render();
}
function login(e){e.preventDefault();let u=db.users.find(x=>(x.email===email.value||x.phone===email.value)&&x.password===password.value);if(!u){alert("Incorrect login details.");return}db.user=u;log("Logged in",u.email);save();render()}
function logout(){log("Logged out");db.user=null;save();render()}
function renderShop(){
document.getElementById("app").innerHTML=`
<header class="topbar"><div class="container" style="display:flex;align-items:center;width:100%">
<div class="logo">🛒 Senior<span>Blink</span></div>
<nav class="nav">
<button onclick="showPage('products')">Products</button><button onclick="showPage('orders')">Orders</button><button onclick="showPage('track')">Track Order</button>
<button class="icon-btn" onclick="showPage('cart')">🛒 <span class="badge cart-badge">${cartCount()}</span></button>
<button class="icon-btn" onclick="showPage('profile')">👤</button>
</nav></div></header><main id="content"></main><footer><div class="container footer-grid"><div><div class="logo" style="color:#fff">🛒 SeniorBlink</div><div class="small">Trusted Grocery & Health Delivery</div></div><div><b>Senior-friendly shopping</b><div class="small">Large controls • Clear text • Simple checkout</div></div></div></footer>`;
showPage("products")
}
function cartCount(){return db.cart.reduce((a,x)=>a+x.qty,0)}
function updateCartBadge(){
  document.querySelectorAll(".cart-badge").forEach(el=>el.textContent=cartCount());
}
function showPage(page){
if(page==="home") home(); if(page==="products") productPage(); if(page==="cart") cartPage(); if(page==="checkout") checkout(); if(page==="payment") payment(); if(page==="orders") orders(); if(page==="track") track(); if(page==="profile") profile()
}
function home(){
const latest=db.orders[0];
document.getElementById("content").innerHTML=`
<section class="hero"><div class="container hero-grid">
<div>
<div class="small">WELCOME BACK, ${db.user.name.toUpperCase()} 👋</div>
<h1>Trusted grocery delivery, made simple for senior citizens.</h1>
<p>SeniorBlink is designed to make everyday shopping easier with readable text, large buttons, simple navigation, saved addresses and clear order tracking.</p>
<div class="row">
<button class="btn btn-primary" onclick="showPage('products')">🛒 Start Shopping</button>
<button class="btn btn-gold" onclick="openLocation()">📍 Detect My Address</button>
</div>
<div class="small" style="margin-top:14px">🔒 Your account and shopping details are securely stored locally on your device.</div>
</div>
<div class="hero-img">🛒🥦🍎</div>
</div></section>

<!-- GENERAL APP INFORMATION SECTION -->
<section class="section"><div class="container">
<div class="panel" style="background:linear-gradient(135deg,#f0f6ff,#eaf4ff);border-color:#c8dfef;">
<h2 style="color:var(--navy);margin-top:0;">ℹ️ Welcome to SeniorBlink General Information</h2>
<p style="color:var(--text);line-height:1.6;">SeniorBlink is your trusted digital companion tailored specifically to help seniors and elderly individuals order fresh groceries, daily essentials, and health care products right from the comfort of home without any hassle.</p>
<div class="grid" style="margin-top:20px;">
<div class="card" style="background:#fff;"><b>🕒 Delivery Timings</b><p class="small">Orders are delivered safely between 8:00 AM and 8:00 PM every day.</p></div>
<div class="card" style="background:#fff;"><b>📞 Senior Support Helpline</b><p class="small">Need assistance placing an order? Call our dedicated help desk anytime.</p></div>
<div class="card" style="background:#fff;"><b>🛡️ Quality Assurance</b><p class="small">All items are carefully inspected for freshness and safety before dispatch.</p></div>
</div>
</div>
</div></section>

<section class="section"><div class="container">
<div class="section-title"><h2>Everything You Need in One Place</h2></div>
<div class="grid">
<div class="card"><div style="font-size:2.2rem">🛍️</div><h3>Daily Groceries</h3><p>Fruits, vegetables, dairy, bread, staples, snacks and household essentials.</p><button class="btn btn-outline" onclick="showPage('products')">Browse Groceries</button></div>
<div class="card"><div style="font-size:2.2rem">💊</div><h3>Health & Care</h3><p>Keep personal-care and everyday wellness essentials easy to find in one place.</p><button class="btn btn-outline" onclick="productPage('Personal Care')">View Care Items</button></div>
<div class="card"><div style="font-size:2.2rem">🚚</div><h3>Simple Delivery</h3><p>Save your delivery address once and use it automatically during future checkouts.</p><button class="btn btn-outline" onclick="openLocation()">Set Address</button></div>
<div class="card"><div style="font-size:2.2rem">📦</div><h3>Track Every Order</h3><p>See order status from placed and processing to out-for-delivery and delivered.</p><button class="btn btn-outline" onclick="showPage('track')">Track Order</button></div>
</div></div></section>

<section class="section" style="padding-top:0"><div class="container">
<div class="stats">
<div class="stat"><span>🛒 Cart Items</span><b>${cartCount()}</b><span class="small">Ready for checkout</span></div>
<div class="stat"><span>📦 Total Orders</span><b>${db.orders.length}</b><span class="small">Saved in your profile</span></div>
<div class="stat"><span>📍 Delivery Address</span><b>${db.user.address?"Saved":"Not set"}</b><span class="small">${db.user.address?"Ready to use":"Set your address"}</span></div>
</div>
</div></section>

<section class="section" style="padding-top:0"><div class="container">
<div class="panel">
<div class="section-title"><div><h2>📍 Your Delivery Address</h2><p class="small">Detect your current location or enter your address manually.</p></div><button class="btn btn-primary" onclick="openLocation()">Detect My Location</button></div>
<div id="homeAddress">${db.user.address?`<div class="alert">📌 ${db.user.address}</div>`:`<div class="card"><b>No delivery address saved.</b><p class="small">Use “Detect My Location” to request GPS access and automatically extract an address.</p></div>`}</div>
</div></div></section>

<section class="section" style="padding-top:0"><div class="container">
<div class="section-title"><h2>How SeniorBlink Works</h2></div>
<div class="grid">
<div class="card"><b>1. Create your account</b><p class="small">Your profile is securely saved.</p></div>
<div class="card"><b>2. Choose groceries</b><p class="small">Use large product cards and clear categories.</p></div>
<div class="card"><b>3. Confirm your address</b><p class="small">Your saved address appears automatically at checkout.</p></div>
<div class="card"><b>4. Pay & track</b><p class="small">Choose your payment method and follow your order.</p></div>
</div></div></section>

<section class="section" style="padding-top:0"><div class="container">
<div class="section-title"><h2>Popular Groceries</h2><button class="btn btn-outline" onclick="showPage('products')">View All Products</button></div>
<div class="grid">${products.slice(0,4).map(productCard).join("")}</div>
</div></section>

<section class="section" style="padding-top:0"><div class="container">
<div class="panel" style="background:linear-gradient(120deg,#edf7ff,#fff)">
<h2>🔐 Data Security & Privacy</h2>
<p>SeniorBlink securely stores login information, profile details, cart items, orders, activity and delivery location in your local device storage. Logging out only ends the active session; your account remains securely saved.</p>
<div class="row"><button class="btn btn-primary" onclick="showPage('profile')">Open My Profile</button><button class="btn btn-outline" onclick="settings()">View Local Data Settings</button></div>
</div></div></section>`;
updateCartBadge();
}
function productPage(cat=""){
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="section-title"><div><h2>All Products</h2><p class="small">Choose what you need today.</p></div><button class="btn btn-primary" onclick="showPage('cart')">🛒 Cart (<span class="product-cart-count">${cartCount()}</span>)</button></div>
<input class="search" id="search" placeholder="🔎 Search for products..." oninput="filterProducts('${cat}')">
<div class="row" style="margin:15px 0;flex-wrap:wrap"><button class="btn btn-outline" onclick="filterProducts('')">All</button>${cats.map(c=>`<button class="btn btn-outline" onclick="filterProducts('${c[0]}')">${c[1]} ${c[0]}</button>`).join("")}</div>
<div id="productGrid" class="grid"></div></div></section>`;
filterProducts(cat)
}
function filterProducts(cat=""){
let q=(document.getElementById("search")?.value||"").toLowerCase();
let list=products.filter(p=>(!cat||p.cat===cat)&&(p.name.toLowerCase().includes(q)||p.cat.toLowerCase().includes(q)));
document.getElementById("productGrid").innerHTML=list.map(productCard).join("")||`<div class="empty" style="grid-column:1/-1">No products found.</div>`; updateCartBadge(); document.querySelectorAll(".product-cart-count").forEach(el=>el.textContent=cartCount())
}
function productCard(p){return `<article class="card product"><div class="product-img">${p.emoji}</div><h3>${p.name}</h3><p>${p.desc}</p><div class="row space"><div><div class="price">${money(p.price)}</div><span class="small">${p.unit}</span></div><button class="btn btn-primary" onclick="addCart(${p.id})">Add to Cart</button></div></article>`}
function addCart(id){
  let x=db.cart.find(x=>x.id===id);
  x ? x.qty++ : db.cart.push({id,qty:1});
  log("Added to cart",products.find(p=>p.id===id).name);
  save();
  updateCartBadge();
  showPage("products");
}
function cartPage(){
let items=db.cart.map(x=>({...products.find(p=>p.id===x.id),qty:x.qty}));let subtotal=items.reduce((a,x)=>a+x.price*x.qty,0),delivery=subtotal?40:0,total=subtotal+delivery;
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="panel"><div class="section-title"><h2>Your Cart (${cartCount()} items)</h2><button class="btn btn-outline" onclick="showPage('products')">← Continue Shopping</button></div>${items.length?items.map(x=>`<div class="cart-item"><div class="mini-img">${x.emoji}</div><div><b>${x.name}</b><div class="small">${x.unit}</div><div class="qty" style="margin-top:7px"><button onclick="changeQty(${x.id},-1)">−</button><b>${x.qty}</b><button onclick="changeQty(${x.id},1)">+</button><button class="btn btn-danger" onclick="removeCart(${x.id})">Remove</button></div></div><div class="price">${money(x.price*x.qty)}</div></div>`).join("")+`<div style="max-width:400px;margin:25px 0 0 auto"><div class="row space"><span>Subtotal</span><b>${money(subtotal)}</b></div><div class="row space"><span>Delivery</span><b>${money(delivery)}</b></div><hr><div class="row space"><span class="total">Total</span><span class="total">${money(total)}</span></div><button class="btn btn-primary" style="width:100%;margin-top:15px" onclick="showPage('checkout')">Proceed to Checkout</button></div>`:`<div class="empty">🛒<h3>Your cart is empty</h3><p>Add some groceries to continue.</p><button class="btn btn-primary" onclick="showPage('products')">Browse Products</button></div>`}</div></div></section>`
}
function changeQty(id,n){
  let x=db.cart.find(x=>x.id===id);
  if(!x)return;
  x.qty+=n;
  if(x.qty<=0)db.cart=db.cart.filter(y=>y.id!==id);
  save();
  updateCartBadge();
  cartPage();
}
function removeCart(id){
  db.cart=db.cart.filter(x=>x.id!==id);
  log("Removed item from cart");
  save();
  updateCartBadge();
  cartPage();
}
function checkout(){
if(!db.cart.length){showPage("cart");return}
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="panel"><h2>Checkout</h2><div class="form-group"><label>Delivery Address</label><textarea class="form-control" id="address" rows="3" placeholder="Enter your full delivery address">${db.user.address||""}</textarea><button type="button" class="btn btn-outline" style="margin-top:8px" onclick="openLocation()">📍 Detect / Update Saved Location</button></div><div class="form-group"><label>Payment Method</label><select class="form-control" id="method"><option>Cash on Delivery</option><option>UPI</option><option>Debit / Credit Card</option></select></div><div class="alert">🔒 Your transaction details are processed securely.</div><button class="btn btn-primary" onclick="placeOrder()">Place Order</button></div></div></section>`
}
function placeOrder(){
let addr=document.getElementById("address").value.trim();if(!addr){alert("Please enter delivery address.");return}
db.user.address=addr;let subtotal=db.cart.reduce((a,x)=>a+products.find(p=>p.id===x.id).price*x.qty,0),method=document.getElementById("method").value;
if(method==="Debit / Credit Card"||method==="UPI"){db.checkout={addr,method};save();showPage("payment");return}
createOrder(method,addr)
}
function payment(){
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="panel" style="max-width:650px;margin:auto"><h2>🔒 Secure Payment Gateway</h2><p class="small">Enter your payment information securely.</p><div class="form-group"><label>${db.checkout.method==="UPI"?"UPI ID":"Card Number"}</label><input class="form-control" id="pay1" placeholder="${db.checkout.method==="UPI"?"example@upi":"1234 5678 9012 3456"}" required></div><div class="row"><div class="form-group" style="flex:1"><label>${db.checkout.method==="UPI"?"Name":"Expiry Date"}</label><input class="form-control" id="pay2" placeholder="${db.checkout.method==="UPI"?"Your name":"MM / YY"}"></div><div class="form-group" style="flex:1"><label>${db.checkout.method==="UPI"?"":"CVV"}</label><input class="form-control" id="pay3" placeholder="${db.checkout.method==="UPI"?"":"123"}"></div></div><button class="btn btn-primary" onclick="completePayment()">Pay & Place Order</button></div></div></section>`
}
function completePayment(){if(!document.getElementById("pay1").value.trim()){alert("Please enter payment details.");return}createOrder(db.checkout.method,db.checkout.addr)}
function createOrder(method,addr){
let items=db.cart.map(x=>({...products.find(p=>p.id===x.id),qty:x.qty})),total=items.reduce((a,x)=>a+x.price*x.qty,0)+40;
let order={id:"GC"+Date.now().toString().slice(-10),date:new Date().toLocaleString(),items,total,method,address:addr,status:0};
db.orders.unshift(order);db.cart=[];delete db.checkout;log("Order placed",order.id);save();updateCartBadge();showPage("orders")
}
function orders(){
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="panel"><div class="section-title"><h2>Order History</h2><button class="btn btn-primary" onclick="showPage('products')">Shop Again</button></div>${db.orders.length?db.orders.map(o=>`<div class="card" style="margin:12px 0"><div class="row space"><div><b>Order #${o.id}</b><div class="small">${o.date}</div></div><div class="price">${money(o.total)}</div></div><p>${o.items.map(i=>`${i.emoji} ${i.name} × ${i.qty}`).join(" • ")}</p><span class="alert" style="display:inline-block;padding:7px 12px">${statusText(o.status)}</span><button class="btn btn-outline" style="float:right" onclick="showTrack('${o.id}')">View / Track</button><div style="clear:both"></div></div>`).join(""):`<div class="empty">📦<h3>No orders yet</h3><button class="btn btn-primary" onclick="showPage('products')">Start Shopping</button></div>`}</div></div></section>`
}
function statusText(s){return ["Order Placed","Processing","Out for Delivery","Delivered"][s]||"Order Placed"}
function showTrack(id){sessionStorage.setItem("trackId",id);showPage("track")}
function track(){
let o=db.orders.find(x=>x.id===sessionStorage.getItem("trackId"))||db.orders[0];
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="panel"><h2>Track Your Order</h2>${o?`<div class="row space"><div><b>Order #${o.id}</b><div class="small">${o.date}</div></div><button class="btn btn-outline" onclick="showPage('orders')">Order History</button></div><div class="track">${["Order Placed","Processing","Out for Delivery","Delivered"].map((s,i)=>`<div class="step ${i<=o.status?"done":""}"><div class="dot"></div><b>${s}</b>${i===o.status?`<div class="small">Current</div>`:""}</div>`).join("")}</div><div class="alert">🚚 ${o.status<3?"Your order is being prepared with care.":"Your order has been delivered."}</div><p><b>Delivery address:</b> ${o.address}</p><p><b>Payment:</b> ${o.method}</p><button class="btn btn-primary" onclick="advanceOrder('${o.id}')">${o.status<3?"Update Tracking Status":"Tracking Complete"}</button>`:`<div class="empty">No order available to track.</div>`}</div></div></section>`
}
function advanceOrder(id){let o=db.orders.find(x=>x.id===id);if(o&&o.status<3){o.status++;log("Order status updated",`${id}: ${statusText(o.status)}`);save();track()}}
function profile(){
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="layout"><aside class="sidebar"><button class="side-btn active">👤 Profile</button><button class="side-btn" onclick="activity()">📋 Activity</button><button class="side-btn" onclick="settings()">⚙️ Settings</button><button class="side-btn" onclick="logout()">↪️ Logout</button></aside><div class="panel"><h2>My Profile</h2><div class="form-group"><label>Full Name</label><input class="form-control" id="pname" value="${db.user.name}"></div><div class="form-group"><label>Phone</label><input class="form-control" id="pphone" value="${db.user.phone}"></div><div class="form-group"><label>Email</label><input class="form-control" value="${db.user.email}" disabled></div><div class="form-group"><label>Saved Address</label><textarea class="form-control" id="paddress" rows="3">${db.user.address||""}</textarea><button type="button" class="btn btn-outline" style="margin-top:8px" onclick="openLocation()">📍 Detect / Update Location</button></div><button class="btn btn-primary" onclick="saveProfile()">Save Changes</button><button class="btn btn-danger" style="margin-left:8px" onclick="logout()">Logout</button></div></div></div></section>`
}
function saveProfile(){db.user.name=document.getElementById("pname").value;db.user.phone=document.getElementById("pphone").value;db.user.address=document.getElementById("paddress").value;let u=db.users.find(x=>x.id===db.user.id);Object.assign(u,db.user);log("Profile updated");save();alert("Profile information saved successfully.");profile()}
function activity(){
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="panel"><div class="section-title"><h2>My Activity</h2><button class="btn btn-outline" onclick="profile()">← Profile</button></div>${db.activity.length?db.activity.map(a=>`<div style="padding:13px 0;border-bottom:1px solid var(--border)"><b>${a.action}</b><div class="small">${a.details} • ${a.time}</div></div>`).join(""):`<div class="empty">No activity recorded yet.</div>`}</div></div></section>`
}
function settings(){
document.getElementById("content").innerHTML=`<section class="dashboard"><div class="container"><div class="panel"><div class="section-title"><h2>Settings & Application Data</h2><button class="btn btn-outline" onclick="profile()">← Profile</button></div><div class="card"><label><b>Notifications</b><input type="checkbox" style="float:right" ${db.settings.notifications?"checked":""} onchange="db.settings.notifications=this.checked;save()"></label></div><div class="card" style="margin-top:12px"><b>Language</b><select class="form-control" onchange="db.settings.language=this.value;save()" style="margin-top:8px"><option ${db.settings.language==="English"?"selected":""}>English</option><option ${db.settings.language==="Kannada"?"selected":""}>Kannada</option><option ${db.settings.language==="Hindi"?"selected":""}>Hindi</option></select></div><div class="card" style="margin-top:12px"><h3>Data Storage Management</h3><p class="small">All registered accounts, saved profiles, cart items, orders, tracking logs, activity history, and delivery locations are securely maintained within your browser's local storage engine. Geolocation coordinates are captured strictly for delivery precision. Reverse address resolution utilizes OpenStreetMap services.</p><button class="btn btn-danger" onclick="clearLocalData()">Clear Application Data</button></div></div></div></section>`
}
function clearLocalData(){if(confirm("Are you sure you want to clear all SeniorBlink application data from this device?")){localStorage.removeItem(KEY);location.reload()}}
render();
