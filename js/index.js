const BOOKS_URL = 'https://raw.githubusercontent.com/benoitvallon/100-best-books/master/';
const STORAGE_PREFIX = 'MauOsc';
const PAGE_SIZE = 2;
const form = document.querySelector('#library-form');
const newBookBtn = document.querySelector('#new-book');
const prevPageBtn = document.querySelector('#prev-page');
const nextPageBtn = document.querySelector('#next-page');
const firstPageBtn = document.querySelector('#first-page');
const lastPageBtn = document.querySelector('#last-page');
const library = [];
let currentPage = 0;

function lastPage() {
  return Math.floor((library.length - 1) / PAGE_SIZE);
}

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
    description = '',
    imageLink = '',
    read = false,
  }) {
    this.author = author;
    this.title = title;
    this.pages = `${pages}`;
    this.read = !!read;
    this.imageLink = imageLink;
    this.description = description;
  }

  set readStatus(status) {
    this.read = status;
  }

  get readStatus() {
    return this.read;
  }

  addElement(container, name, prepareFn = (itm, dat) => { dat.textContent = itm; }) {
    const data = document.createElement('div');
    data.classList.add(`book-${name}`);
    prepareFn(this[name], data);
    container.appendChild(data);
  }

  render(index) {
    const bookContainer = document.createElement('div');
    bookContainer.id = currentPage * PAGE_SIZE + index;
    bookContainer.classList.add('book-container');

    this.addElement(bookContainer, 'imageLink', (itm, dat) => {
      let image;
      if (itm !== '') {
        image = document.createElement('img');
        image.src = itm;
      } else {
        image = document.createElement('div');
        image.textContent = 'No cover available.';
      }
      dat.appendChild(image);
    });
    this.addElement(bookContainer, 'title');
    this.addElement(bookContainer, 'author', (itm, dat) => {
      dat.textContent = `by ${itm}`;
    });
    this.addElement(bookContainer, 'description', (itm, dat) => {
      dat.textContent = `${itm}`;
    });
    this.addElement(bookContainer, 'pages', (itm, dat) => {
      dat.textContent = `${itm} pages`;
    });
    this.addElement(bookContainer, 'read', (itm, dat) => {
      dat.textContent = itm ? '✓ read' : '✗ read';
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

  async fetchCover() {
    const lf = new Intl.ListFormat();
    const key = `${this.title.replace(' ', '+')}+${this.author.replace(' ', '+')}`;
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${key}&maxResults=1&orderBy=relevance`);
    const {
      items: [
        {
          volumeInfo: {
            pageCount = 0,
            authors = [],
            description = '',
            imageLinks: {
              thumbnail = '',
            } = {},
          } = {},
        } = {},
      ] = [],
    } = await response.json();
    this.description = description;
    this.imageLink = thumbnail;
    this.pages = this.pages || pageCount;
    this.author = this.author || lf.format(authors);
  }
}

function storeLibrary() {
  library.forEach((book, idx) => {
    localStorage.setItem(Book.dbBookKey(idx), book.json);
  });
}

function loadLibrary(addBookFn) {
  library.length = 0;
  let idx = 0;
  let key = Book.dbBookKey(idx);
  while (localStorage.getItem(key)) {
    addBookFn(JSON.parse(localStorage.getItem(key)));
    key = Book.dbBookKey(idx += 1);
  }
}

function render(page = currentPage) {
  const libraryContainer = document.querySelector('#library');
  const libContainer = document.createElement('div');
  libContainer.id = 'library';
  library.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).forEach((book, index) => {
    const bookElement = book.render(index);
    libContainer.appendChild(bookElement);
  });
  document.querySelector('.main').replaceChild(libContainer, libraryContainer);
  libContainer.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-book')) {
      const index = event.target.parentElement.id;
      library.splice(index, 1);
      if (currentPage > lastPage()) {
        currentPage = lastPage();
      }
      render();
      storeLibrary();
      localStorage.removeItem(Book.dbBookKey(library.length));
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
  const newBook = new Book(book);
  library.push(newBook);
  return newBook;
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

async function processBook(event) {
  event.preventDefault();
  const book = {};
  const fd = new FormData(form);
  Array.from(fd).forEach(([key, value]) => {
    book[key] = value;
  });

  const newBook = addBookToLibrary(book);
  if (!newBook.imageLink) {
    try {
      await newBook.fetchCover();
    } catch (e) {
      newBook.imageLink = '';
    }
  }
  currentPage = lastPage();
  render();
  storeLibrary();
  form.classList.remove('active');
}

async function loadSampleBooks(event) {
  try {
    const response = await fetch(`${BOOKS_URL}/books.json`);
    const data = await response.json();
    data.forEach((book) => {
      book.imageLink = `${BOOKS_URL}/static/${book.imageLink}`;
      addBookToLibrary(book);
    });
    render();
    storeLibrary();
    event.target.style.display = 'none';
  } catch (e) {
    event.target.style.display = 'block';
  }
}

function clearAllBooks() {
  localStorage.clear();
  library.length = 0;
  render();
}

document.querySelector('#load-sample').addEventListener('click', loadSampleBooks);
document.querySelector('#clear-books').addEventListener('click', clearAllBooks);

form.addEventListener('submit', processBook);
newBookBtn.addEventListener('click', bringUpForm);

prevPageBtn.addEventListener('click', () => { if (currentPage > 0) { render(currentPage -= 1); } });
nextPageBtn.addEventListener('click', () => { if (currentPage < lastPage()) { render(currentPage += 1); } });

firstPageBtn.addEventListener('click', () => { render(currentPage = 0); });
lastPageBtn.addEventListener('click', () => { render(currentPage = lastPage()); });

if (storageAvailable('localStorage') && localStorage.getItem(Book.dbBookKey(0))) {
  loadLibrary(addBookToLibrary);
  currentPage = 0;
  render();
}
