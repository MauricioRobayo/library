const BOOKS_URL = 'https://raw.githubusercontent.com/benoitvallon/100-best-books/master/books.json';
const form = document.querySelector('#library-form');
const newBookBtn = document.querySelector('#new-book');
const library = [];

class Book {
  constructor({
    author,
    title,
    pages,
    imageLink,
    read = false,
  }) {
    this.readSatusBtn = null;
    this.author = author;
    this.title = title;
    this.pages = `${pages}`;
    this.imageLink = imageLink;
    this.read = !!read;
  }

  toggleBookStatus() {
    this.read = !this.read;
    this.readSatusBtn.classList.toggle('active');
  }

  render(index) {
    const bookContainer = document.createElement('div');
    bookContainer.id = index;
    Object.keys(this).forEach((key) => {
      if (typeof this[key] === 'string') {
        const data = document.createElement('div');
        data.innerText = this[key];
        bookContainer.appendChild(data);
      }
    });
    const deleteBtn = document.createElement('button');
    deleteBtn.innerText = 'Delete';
    deleteBtn.class = 'delete-book';
    const readBtn = document.createElement('button');
    this.readSatusBtn = readBtn;
    readBtn.addEventListener('click', this.toggleBookStatus);
    readBtn.innerText = 'Read';
    bookContainer.append(readBtn, deleteBtn);
    return bookContainer;
  }
}

let deleteBook;

function render() {
  const libraryContainer = document.querySelector('#library');
  const libContainer = document.createElement('div');
  libContainer.id = 'library';
  library.forEach((book, index) => {
    const bookElement = book.render(index);
    libContainer.appendChild(bookElement);
  });
  document.body.replaceChild(libContainer, libraryContainer);
  libContainer.addEventListener('click', deleteBook);
}

deleteBook = (event) => {
  if (event.target.class === 'delete-book') {
    const index = event.target.parentElement.id;
    library.splice(index, 1);
    render();
  }
};

function addBookToLibrary(book) {
  library.push(new Book(book));
  render();
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
  form.classList.remove('active');
}

form.addEventListener('submit', processBook);
newBookBtn.addEventListener('click', bringUpForm);

fetch(BOOKS_URL)
  .then((response) => response.json())
  .then((data) => {
    data.slice(0, 4).forEach((book) => {
      book.imageLink = `https://raw.githubusercontent.com/benoitvallon/100-best-books/master/static/${book.imageLink}`;
      addBookToLibrary(book);
    });
  });
