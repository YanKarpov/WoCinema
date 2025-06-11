export function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this, args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

export function setupSearch(inputElem, onSearch) {
  inputElem.addEventListener('input', debounce(() => {
    onSearch(inputElem.value);
  }, 300));
}
