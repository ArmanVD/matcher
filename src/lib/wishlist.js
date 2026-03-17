export function getWishlist() {
  return JSON.parse(localStorage.getItem("matcher_wishlist") ?? "[]");
}

export function saveWishlist(list) {
  localStorage.setItem("matcher_wishlist", JSON.stringify(list));
}
