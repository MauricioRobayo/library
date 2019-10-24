const form = document.querySelector('#library-form');
const library = [];

class Book {
  constructor({ author, title, pages }) {
    this.author = author;
    this.title = title;
    this.pages = pages;
  }

  render() {
    const bookContainer = document.createElement('div');
    Object.keys(this).forEach((key) => {
      const data = document.createElement('div');
      data.innerText = this[key];
      bookContainer.appendChild(data);
    });
    return bookContainer;
  }
}

function render() {
  const libraryContainer = document.querySelector('#library');
  const libContainer = document.createElement('div');
  libContainer.id = 'library';
  library.forEach((book) => {
    const bookElement = book.render();
    libContainer.appendChild(bookElement);
  });
  document.body.replaceChild(libContainer, libraryContainer);
}

function addBookToLibrary(book) {
  library.push(new Book(book));
  render();
}

function cleanFields() {
  document.querySelectorAll('input[type=text]').forEach((input) => {
    input.value = '';
  });
}

function processBook(event) {
  event.preventDefault();
  const book = {};
  const fd = new FormData(form);
  Array.from(fd).forEach(([key, value]) => {
    book[key] = value;
  });
  addBookToLibrary(book);
  cleanFields();
}

form.addEventListener('submit', processBook);

fetch(
  'https://raw.githubusercontent.com/benoitvallon/100-best-books/master/books.json',
)
  .then(response => response.json())
  .then((data) => {
    data.slice(0, 10).forEach((book) => {
      addBookToLibrary(book);
    });
  });
