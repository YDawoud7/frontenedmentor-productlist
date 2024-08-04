class Cart extends HTMLElement {
  constructor() {
    super();
    this.cartObj = {};
    this.cartSize = 0;
    this.cartTotal = 0;
  }
  connectedCallback() {
    this.innerHTML = `<div class="cart">
  <p class="cart-size">Your cart (<span>0</span>)</p>
  <div class="cart-empty cart-centered">
    <img class="cart-empty-image" src="assets/images/illustration-empty-cart.svg"/>
    <p>Your added items will appear here</p>
  </div>
  <div class="cart-non-empty hide">
    <div class="cart-centered">
      <ul class="cart-list">
      </ul>
    </div>
    <div class="cart-total-container">
      <p>Order Total</p>
      <p class="cart-total">$<span>0.00</span></p>
    </div>
    <div class="carbon-neutral-info">
      <img src="assets/images/icon-carbon-neutral.svg">
      <p>This is a <span>carbon-neutral</span> delivery</p>
    </div>
    <div class="cart-centered">
      <button class="confirm-order">Confirm Order</button>
    </div>
  </div>
</div>`;
    this.querySelector('.confirm-order').onclick = () => {
      let orderConfirmedModal = document.querySelector('.modal-order-confirmed');
      orderConfirmedModal.style.top = window.scrollY + 'px';



      orderConfirmedModal.onclick = e => {
        if (e.target == orderConfirmedModal) location.reload();
      }
      
      orderConfirmedModal.classList.remove('hide');
      let reviewCartList = orderConfirmedModal.querySelector('.cart-list');
      for (let cartProduct of this.querySelector('.cart-list').children) {
        let reviewCartProduct = new ReviewCartProduct(cartProduct);
        reviewCartList.append(reviewCartProduct);
        reviewCartList.append(document.createElement('hr'));
      }
      orderConfirmedModal.querySelector('.start-new-order').onclick = () => location.reload()
      orderConfirmedModal.querySelector('.cart-total').textContent = this.querySelector('.cart-total').textContent;

      let orderConfirmedModalContent = orderConfirmedModal.querySelector('.modal-content');
      
      setTimeout(() => {
        if (orderConfirmedModalContent.getBoundingClientRect().height< orderConfirmedModal.getBoundingClientRect().height) {
          // orderConfirmedModalContent
          // console.log(orderConfirmedModalContent.getBoundingClientRect().height + ' ' + orderConfirmedModal.getBoundingClientRect().height);
          orderConfirmedModal.style.padding = '0';
          orderConfirmedModalContent.style.cssText += `
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          `
        }
      });
      // if (orderConfirmedModal.getBoundingClientRect().top < document.body.getBoundingClientRect().top)
      //   orderConfirmedModal.style.marginTop = document.body.getBoundingClientRect().top - orderConfirmedModal.getBoundingClientRect().top  + 'px';
    }
  }

  cartChangedCallback(name, newValue, oldValue) {
    // console.log(oldValue + ' ' + newValue);
    let menuItem = document.querySelector(`menu-item[product-name="${name}"`);
    let productPrice = menuItem.getAttribute('product-price');
    let oldCartSize = this.cartSize;
    this.cartSize += newValue - oldValue;
    this.cartTotal += (newValue - oldValue)*productPrice
    this.querySelector('.cart-size span').textContent = this.cartSize;
    this.querySelector('.cart-total span').textContent = this.cartTotal.toFixed(2);
    if (this.cartSize == 0) {
      this.querySelector('.cart-list').innerHTML = '';
      this.querySelector('.cart-non-empty').classList.add('hide');
      this.querySelector('.cart-empty').classList.remove('hide');
      return;
    }
    else if (oldCartSize == 0) {
      this.querySelector('.cart-non-empty').classList.remove('hide');
      this.querySelector('.cart-empty').classList.add('hide');
    }

    if (newValue == 0) {
      this.querySelector('li.cart-product.' + noSpace(name)).remove();
      return;
    }    
    else if (oldValue == 0) {
      if (newValue != 1) throw new Error("hmm?");
      this.querySelector('.cart-list').append(new CartProduct(menuItem));
    }
    let cartItem = this.querySelector('li.cart-product.' + noSpace(name));
    cartItem.querySelector('.cart-product-quantity span').textContent = newValue;
    cartItem.querySelector('.cart-product-total span').textContent = (newValue*productPrice).toFixed(2);
  }
  static cartHandler = {
    set(target, property, value) {
      if (property == 'cartSize' || property == 'cartTotal' || property == 'cartObj') {
        target[property] = value;
        return true;
      }
      target.cartChangedCallback(property, value, target[property]??0);
      target[property] = value;
      return true;
    }
  }
}
const cart = document.querySelector('cart-');
const cartInterface = new Proxy(cart, Cart.cartHandler);

class MenuItem extends HTMLElement {
  constructor(attrObj) {
    super();
    this.attrObj = attrObj ?? {};
  }
  connectedCallback() {
    for (let [attrName, attrVal] of Object.entries(this.attrObj)) {
      this.setAttribute(attrName, attrVal);
    }

    this.innerHTML = `<img src="${this.getAttribute('product-image')}" alt="${this.getAttribute('product-image-alt')}" class="product-image">
  <button class="add-first">
    <img class="cart-icon" src="assets/images/icon-add-to-cart.svg"/><p>Add to cart</p>
  </button>
  <div class="add-remove hide">
    <button class="remove"><img src="assets/images/icon-decrement-quantity.svg"></button>
    <p class="product-quantity">${this.getAttribute('product-quantity')}</p>
    <button class="add"><img src="assets/images/icon-increment-quantity.svg"/></button>
  </div>
  <div class="product-info">
    <p class="product-category">${this.getAttribute('product-category')}</p>
    <p class="product-name">${this.getAttribute('product-name')}</p>
    <p class="product-price">$<span>${this.getAttribute('product-price')}</span></p>
  </div>`;
    this.querySelector('.add').onclick = this.querySelector('.add-first').onclick = () => this.setAttribute('product-quantity', parseInt(this.getAttribute('product-quantity'))+1);
    this.querySelector('.remove').onclick = () => this.setAttribute('product-quantity', Math.max(0, parseInt(this.getAttribute('product-quantity'))-1));

    // this.classList.add(noSpace(this.getAttribute('product-name')??this.attrObj['product-name']));
  }
  static get observedAttributes() {
    return ["product-quantity", "product-image"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name == 'product-image') {
      this.firstElementChild.src = newValue;
      return;
    }
    cartInterface[this.getAttribute('product-name')] = newValue;
    if (newValue == '0') {
      this.querySelector('.add-remove').classList.add('hide');
      this.querySelector('.add-first').classList.remove('hide');
      return;
    }
    else if (oldValue == '0') {
      this.querySelector('.add-first').classList.add('hide');
      this.querySelector('.add-remove').classList.remove('hide');
    }
    // setTimeout(()=>this.querySelector('.product-quantity').textContent = newValue);
    this.querySelector('.product-quantity').textContent = newValue;
  }

};

function CartProduct(productElem) {
  let cartProduct = document.createElement('li');
  cartProduct.classList.add("cart-product", noSpace(productElem.getAttribute("product-name")));
  cartProduct.innerHTML = `<p class="cart-product-name">${productElem.getAttribute("product-name")}</p>
  <div class="cart-product-amount">
    <p class="cart-product-quantity"><span>1</span>x</p>
    <p class="cart-product-price">@ $<span>${productElem.getAttribute("product-price")}</span></p>
    <p class="cart-product-total">$<span>${productElem.getAttribute("product-price")}</span></p>              
  </div>
  <button class="cart-product-remove"><img src="assets/images/icon-remove-item.svg"/></button>
  <hr>
  `;
  cartProduct.querySelector('.cart-product-remove').onclick = () => {
    // cart.cartChangedCallback(productElem.getAttribute("product-name"), 0, productElem.getAttribute('product-quantity'));
    productElem.setAttribute('product-quantity', 0);
  }
  return cartProduct;
}

function ReviewCartProduct(cartProduct) {
  let productName = cartProduct.querySelector('.cart-product-name').textContent;
  let productThumbnail = productImages[productName].thumbnail;
  let productPrice = cartProduct.querySelector('.cart-product-price span').textContent;
  let productQuantity = cartProduct.querySelector('.cart-product-quantity span').textContent;
  let productTotal = (parseFloat(productPrice) * parseFloat(productQuantity)).toFixed(2);

  let reviewCartProduct = document.createElement('li');
  reviewCartProduct.classList.add("cart-product", 'review-cart-product');
  reviewCartProduct.innerHTML = `
  <div class='review-cart-product-left'>
    <img src='${productThumbnail}' alt='${productName}'/>
    <div class='review-cart-product-right'>
      <p class="cart-product-name">${productName}</p>
      <div class="review-cart-product-amount">
        <p class="cart-product-quantity"><span>${productQuantity}</span>x</p>
        <p class="cart-product-price">@ $${productPrice}</p>
      </div>
    </div>
  </div>
  <p class="cart-product-total">$<span>${productTotal}</span></p>   
  `;
  
  return reviewCartProduct;
}

function noSpace(str) {
  return str.toLowerCase().replaceAll(' ', '-');
}

function getCurrScreenType() {
  const desktopMin = 800, tabletMin = 480;
  // let width = document.documentElement.clientWidth;
  let width = window.innerWidth;
  console.log(width + 'px');
  if (width > desktopMin) return 'desktop';
  else if (width > tabletMin) return 'tablet';
  else return 'mobile';
}

customElements.define("menu-item", MenuItem);
customElements.define("cart-", Cart);



let productImages = {};
(async function() {
  let menuData = await fetch('data.json').then(res => res.text()).then(text => JSON.parse(text));
  // console.dir(menuData);
  window.currScreenType = getCurrScreenType();
  console.log(currScreenType);

  menuData.forEach(productData => {
    productImages[productData.name] = productData.image;
    productData.image = productData.image[window.currScreenType];
    for (let productProperty in productData) {
      productData["product-"+productProperty] = productData[productProperty];
      delete productData[productProperty];
    }
    productData['product-price'] = productData['product-price'].toFixed(2);
    let productElem = new MenuItem(Object.assign(productData, {'product-image-alt': productData["product-name"], 'product-quantity': 0}));
    document.querySelector('.menu ul').append(productElem);
  });

  window.addEventListener('resize', e => {
    let screenType = getCurrScreenType();
    if (screenType == window.currScreenType) return;
    window.currScreenType = screenType;
    Array.from(document.querySelector('.product-list').children).forEach(product => {
      product.setAttribute('product-image', productImages[product.getAttribute('product-name')][screenType]);
    });
  });
})();

// setTimeout(() => document.querySelector('menu-item').setAttribute('product-quantity', 0), 1000);
// document.body.append(new MenuItem({"product-category": "testing"}));