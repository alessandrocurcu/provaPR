function add_item_to_cart(name, price, quantity) {
  cart = add_item(cart, name, price, quantity);

  calc_cart_total();
}

function calc_cart_total() {
  total = 0;

  cost_ajax(cart, function (cost) {
    total += cost;

    shipping_ajax(cart, function (shipping) {
      total += shipping;

      update_total_dom(total);
    });
  });
}

function calc_cart_total2() {
  total = 0;

  cost_ajax(cart, function (cost) {
    total += cost;

    shipping_ajax(cart, function (shipping) {
      total += shipping;

      update_total_dom(total);
    });
  });
}

function calc_cart_total3() {
  var total = 0;

  cost_ajax(cart, function (cost) {
    total += cost;

    shipping_ajax(cart, function (shipping) {
      total += shipping;

      update_total_dom(total);
    });
  });
}

function calc_cart_total(cart) {
  var total = 0;

  cost_ajax(cart, function (cost) {
    total += cost;

    shipping_ajax(cart, function (shipping) {
      total += shipping;

      update_total_dom(total);
    });
  });
}
