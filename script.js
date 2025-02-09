const apiKey = 'AIzaSyB7TPy6qAycFg7KD4anxjJMxtdG15tMNaA';
const libraryKey = 'library';

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchTab').addEventListener('click', showSearch);
  document.getElementById('libraryTab').addEventListener('click', showLibrary);

  document.getElementById('searchBtn').addEventListener('click', searchBooks);

  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchBooks();
    }
  });

});

function showSearch() {
  document.getElementById('searchSection').style.display = 'block';
  document.getElementById('librarySection').style.display = 'none';
}

function showLibrary() {
  document.getElementById('searchSection').style.display = 'none';
  document.getElementById('librarySection').style.display = 'block';
  loadLibrary();
}

//
//Search Functions
//

function searchBooks() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;

  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${apiKey}`;

  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      displaySearchResults(data.items);
    })
    .catch((error) => {
      console.error('Error fetching books:', error);
    });
}

function displaySearchResults(books) {
  const searchResultsDiv = document.getElementById('searchResults');
  searchResultsDiv.innerHTML = '';

  if (!books || books.length === 0) {
    searchResultsDiv.innerHTML = '<p>No books found.</p>';
    return;
  }

  const library = JSON.parse(localStorage.getItem(libraryKey)) || [];
  const libraryIds = library.map((book) => book.id);

  books.forEach((item) => {
    const volumeInfo = item.volumeInfo;
    const bookId = item.id;
    const title = volumeInfo.title || 'No Title';
    const authors = volumeInfo.authors || [];
    const thumbnail = volumeInfo.imageLinks
      ? volumeInfo.imageLinks.thumbnail
      : 'https://via.placeholder.com/128x195?text=No+Cover';

    const bookDiv = document.createElement('div');
    bookDiv.className = 'book';
    bookDiv.innerHTML = `
      <img src="${thumbnail}" alt="${title} cover">
      <div>
        <h3>${title}</h3>
        <p>By: ${authors.join(', ')}</p>
        <button class="add-btn" data-id="${bookId}">${
      libraryIds.includes(bookId) ? 'Added' : 'Add to Library'
    }</button>
      </div>
    `;
    searchResultsDiv.appendChild(bookDiv);

    const addBtn = bookDiv.querySelector('.add-btn');
    if (libraryIds.includes(bookId)) {
      addBtn.disabled = true;
    }
    addBtn.addEventListener('click', function () {
      addBookToLibrary({
        id: bookId,
        title: title,
        authors: authors,
        thumbnail: thumbnail,
        shelf: 'Want to Read',
        progress: 0,
      });
      addBtn.innerText = 'Added';
      addBtn.disabled = true;
    });
  });
}

function addBookToLibrary(bookData) {
  let library = JSON.parse(localStorage.getItem(libraryKey)) || [];
  if (library.some((book) => book.id === bookData.id)) return;

  library.push(bookData);
  localStorage.setItem(libraryKey, JSON.stringify(library));
}

//
//Library Functions
//

function loadLibrary() {
  let library = JSON.parse(localStorage.getItem(libraryKey)) || [];
  const libraryBooksDiv = document.getElementById('libraryBooks');
  libraryBooksDiv.innerHTML = '';

  if (library.length === 0) {
    libraryBooksDiv.innerHTML = '<p>Your library is empty. Add some books!</p>';
    return;
  }

  const filterDiv = document.createElement('div');
  filterDiv.innerHTML = `
    <label for="shelfFilter">Filter by Shelf: </label>
    <select id="shelfFilter">
      <option value="All">All</option>
      <option value="Want to Read">Want to Read</option>
      <option value="Currently Reading">Currently Reading</option>
      <option value="Finished">Finished</option>
    </select>
  `;
  libraryBooksDiv.appendChild(filterDiv);

  document.getElementById('shelfFilter').addEventListener('change', function () {
    renderLibraryBooks(library, this.value);
  });

  renderLibraryBooks(library, 'All');
}

function renderLibraryBooks(library, filterShelf) {
  const libraryBooksDiv = document.getElementById('libraryBooks');
  const existingBooks = document.querySelectorAll('.library-book');
  existingBooks.forEach((book) => book.remove());

  library.forEach((book) => {
    if (filterShelf !== 'All' && book.shelf !== filterShelf) {
      return;
    }
    const bookDiv = document.createElement('div');
    bookDiv.className = 'library-book book';
    bookDiv.innerHTML = `
      <img src="${book.thumbnail}" alt="${book.title} cover">
      <div>
        <h3>${book.title}</h3>
        <p>By: ${book.authors ? book.authors.join(', ') : 'Unknown'}</p>
        <label for="shelf-${book.id}">Shelf: </label>
        <select id="shelf-${book.id}">
          <option value="Want to Read" ${book.shelf === 'Want to Read' ? 'selected' : ''}>Want to Read</option>
          <option value="Currently Reading" ${book.shelf === 'Currently Reading' ? 'selected' : ''}>Currently Reading</option>
          <option value="Finished" ${book.shelf === 'Finished' ? 'selected' : ''}>Finished</option>
        </select>
        <div>
          <label for="progress-${book.id}">Progress: ${book.progress}%</label>
          <div class="progress-bar">
            <div class="progress" id="progress-bar-${book.id}" style="width: ${book.progress}%"></div>
          </div>
          <input type="range" id="progress-${book.id}" min="0" max="100" value="${book.progress}">
        </div>
        <button class="remove-btn" data-id="${book.id}">Remove from Library</button>
      </div>
    `;
    libraryBooksDiv.appendChild(bookDiv);

    document.getElementById(`shelf-${book.id}`).addEventListener('change', function () {
      updateBookShelf(book.id, this.value);
    });

    document.getElementById(`progress-${book.id}`).addEventListener('input', function () {
      updateBookProgress(book.id, this.value);
    });

    bookDiv.querySelector('.remove-btn').addEventListener('click', function () {
      removeBookFromLibrary(book.id);
    });
  });
}

function updateBookShelf(bookId, newShelf) {
  let library = JSON.parse(localStorage.getItem(libraryKey)) || [];
  library = library.map((book) => {
    if (book.id === bookId) {
      book.shelf = newShelf;
    }
    return book;
  });
  localStorage.setItem(libraryKey, JSON.stringify(library));
  const shelfFilter = document.getElementById('shelfFilter')
    ? document.getElementById('shelfFilter').value
    : 'All';
  renderLibraryBooks(library, shelfFilter);
}

function updateBookProgress(bookId, newProgress) {
  let library = JSON.parse(localStorage.getItem(libraryKey)) || [];
  library = library.map((book) => {
    if (book.id === bookId) {
      book.progress = newProgress;
    }
    return book;
  });
  localStorage.setItem(libraryKey, JSON.stringify(library));

  const progressBar = document.querySelector(`#progress-bar-${bookId}`);
  if (progressBar) {
    progressBar.style.width = newProgress + '%';
  }
  const progressLabel = document.querySelector(`label[for="progress-${bookId}"]`);
  if (progressLabel) {
    progressLabel.innerText = `Progress: ${newProgress}%`;
  }
}

function removeBookFromLibrary(bookId) {
  let library = JSON.parse(localStorage.getItem(libraryKey)) || [];
  library = library.filter((book) => book.id !== bookId);
  localStorage.setItem(libraryKey, JSON.stringify(library));
  loadLibrary();
}
