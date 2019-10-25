const BOOKS_URL = 'https://raw.githubusercontent.com/benoitvallon/100-best-books/master/';
const STORAGE_PREFIX = 'MauOsc';
const form = document.querySelector('#library-form');
const newBookBtn = document.querySelector('#new-book');
const library = [];

function storageAvailable(type) {
  let storage;
  try {
    storage = window[type];
    const x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  } catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22
      // Firefox
      || e.code === 1014
      // test name field too, because code might not be present
      // everything except Firefox
      || e.name === 'QuotaExceededError'
      // Firefox
      || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
      // acknowledge QuotaExceededError only if there's something already stored
      && (storage && storage.length !== 0);
  }
}

class Book {
  constructor({
    author,
    title,
    pages,
    imageLink,
    read = false,
  }) {
    this.author = author;
    this.title = title;
    this.pages = `${pages}`;
    this.imageLink = imageLink;
    this.read = !!read;
  }

  set readStatus(status) {
    this.read = status;
  }

  get readStatus() {
    return this.read;
  }

  render(index) {
    const bookContainer = document.createElement('div');
    bookContainer.id = index;
    Object.keys(this).forEach((key) => {
      const data = document.createElement('div');
      data.innerText = this[key];
      bookContainer.appendChild(data);
    });
    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Delete';
    deleteBtn.classList.add('delete-book');
    const readBtn = document.createElement('button');
    readBtn.classList.add('read-book');
    readBtn.innerText = 'Read';
    bookContainer.append(readBtn, deleteBtn);
    return bookContainer;
  }

  get json() {
    return JSON.stringify(this);
  }

  static dbBookKey(idx) {
    return `${STORAGE_PREFIX}.book.${idx}`;
  }
}

function storeLibrary() {
  library.forEach((book, idx) => {
    localStorage.setItem(Book.dbBookKey(idx), book.json);
  });
}

function loadLibrary(addBookFn) {
  let idx = 0;
  let key = Book.dbBookKey(idx);
  while (localStorage.getItem(key)) {
    addBookFn(JSON.parse(localStorage.getItem(key)));
    key = Book.dbBookKey(idx += 1);
  }
}

function render() {
  const libraryContainer = document.querySelector('#library');
  const libContainer = document.createElement('div');
  libContainer.id = 'library';
  library.forEach((book, index) => {
    const bookElement = book.render(index);
    libContainer.appendChild(bookElement);
  });
  document.body.replaceChild(libContainer, libraryContainer);
  libContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-book')) {
      const index = event.target.parentElement.id;
      library.splice(index, 1);
      render();
      storeLibrary();
    }
    if (event.target.classList.contains('read-book')) {
      const index = event.target.parentElement.id;
      library[index].readStatus = !library[index].readStatus;
      render();
      storeLibrary();
    }
  });
}

function addBookToLibrary(book) {
  library.push(new Book(book));
}

function cleanFields() {
  document.querySelectorAll('input[type=text]').forEach((input) => {
    input.value = '';
  });
}

function bringUpForm() {
  cleanFields();
  form.classList.add('active');
}

function processBook(event) {
  event.preventDefault();
  const book = {};
  const fd = new FormData(form);
  Array.from(fd).forEach(([key, value]) => {
    book[key] = value;
  });
  addBookToLibrary(book);
  render();
  storeLibrary();
  form.classList.remove('active');
}

form.addEventListener('submit', processBook);
newBookBtn.addEventListener('click', bringUpForm);

if (storageAvailable('localStorage') && localStorage.getItem(Book.dbBookKey(0))) {
  loadLibrary(addBookToLibrary);
  render();
} else {
  fetch(`${BOOKS_URL}/books.json`)
    .then(response => response.json())
    .then((data) => {
      data.slice(0, 4).forEach((book) => {
        book.imageLink = `${BOOKS_URL}/static/${book.imageLink}`;
        addBookToLibrary(book);
      });
      render();
      storeLibrary();
    });
}
