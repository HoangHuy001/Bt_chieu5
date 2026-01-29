// ============ GLOBAL VARIABLES ============
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
let itemsPerPage = 10;

// ============ LOAD DATA ============
async function LoadData() {
  try {
    const response = await fetch("db.json");
    allProducts = await response.json();
    filteredProducts = [...allProducts];
    renderProducts();
  } catch (error) {
    console.error("Error loading data:", error);
  }
}

// ============ RENDER PRODUCTS ============
function renderProducts() {
  const tbody = document.querySelector(".table-id");

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const rows = currentProducts
    .map((item) => {
      return `
        <tr>
          <td><strong>${item.id}</strong></td>
          <td>${item.title}</td>
          <td><span style="color: #667eea; font-weight: 600;">$${item.price}</span></td>
          <td><span style="background: #e8eaf6; padding: 4px 12px; border-radius: 20px; font-size: 13px;">${item.category.name}</span></td>
          <td>
            <div class="img-container">
              <img src="${item.images[0]}" alt="${item.title}" width="50" height="50" class="product-img">
              <div class="img-description">${item.description}</div>
            </div>
          </td>
          <td>
            <button class="btn-action btn-edit" onclick="editProduct(${item.id})" data-bs-toggle="modal" data-bs-target="#productModal">
              ✏️ Sửa
            </button>
            <button class="btn-action btn-delete" onclick="deleteProduct(${item.id})">
              🗑️ Xóa
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  tbody.innerHTML = rows;
  renderPagination(totalPages);
}

// ============ PAGINATION ============
function renderPagination(totalPages) {
  const pagination = document.getElementById("pagination");
  if (!pagination) return;

  let paginationHTML = "";

  // Previous button
  paginationHTML += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;">Trước</a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      paginationHTML += `
        <li class="page-item ${i === currentPage ? "active" : ""}">
          <a class="page-link" href="#" onclick="changePage(${i}); return false;">${i}</a>
        </li>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      paginationHTML +=
        '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  // Next button
  paginationHTML += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
      <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;">Sau</a>
    </li>
  `;

  pagination.innerHTML = paginationHTML;
}

// ============ PAGE MANAGEMENT ============
function changePage(page) {
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderProducts();
  }
}

// ============ ITEMS PER PAGE ============
function changeItemsPerPage() {
  itemsPerPage = parseInt(document.getElementById("itemsPerPage").value);
  currentPage = 1;
  renderProducts();
}

// ============ SEARCH ============
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();
      filteredProducts = allProducts.filter((product) =>
        product.title.toLowerCase().includes(searchTerm),
      );
      currentPage = 1;
      renderProducts();
    });
  }
});

// ============ SORTING ============
function handleSort() {
  const sortValue = document.getElementById("sortSelect").value;
  if (!sortValue) return;

  const [type, order] = sortValue.split("-");

  if (type === "name") {
    filteredProducts.sort((a, b) => {
      if (order === "asc") {
        return a.title.localeCompare(b.title);
      } else {
        return b.title.localeCompare(a.title);
      }
    });
  } else if (type === "price") {
    filteredProducts.sort((a, b) => {
      if (order === "asc") {
        return a.price - b.price;
      } else {
        return b.price - a.price;
      }
    });
  }

  currentPage = 1;
  renderProducts();
}

// ============ ADD PRODUCT MODAL ============
function openAddModal() {
  document.getElementById("modalTitle").textContent = "Thêm Sản Phẩm";
  document.getElementById("productForm").reset();
  document.getElementById("productId").value = "";
}

// ============ EDIT PRODUCT ============
function editProduct(id) {
  const product = allProducts.find((p) => p.id === id);
  if (product) {
    document.getElementById("modalTitle").textContent = "Sửa Sản Phẩm";
    document.getElementById("productId").value = product.id;
    document.getElementById("productTitle").value = product.title;
    document.getElementById("productPrice").value = product.price;
    document.getElementById("productDescription").value = product.description;
    document.getElementById("productCategory").value = product.category.name;
    document.getElementById("productImage").value = product.images[0];
  }
}

// ============ SAVE PRODUCT ============
function saveProduct() {
  const id = document.getElementById("productId").value;
  const title = document.getElementById("productTitle").value;
  const price = parseFloat(document.getElementById("productPrice").value);
  const description = document.getElementById("productDescription").value;
  const categoryName = document.getElementById("productCategory").value;
  const imageUrl = document.getElementById("productImage").value;

  if (id) {
    // Edit existing product
    const index = allProducts.findIndex((p) => p.id === parseInt(id));
    if (index !== -1) {
      allProducts[index].title = title;
      allProducts[index].price = price;
      allProducts[index].description = description;
      allProducts[index].category.name = categoryName;
      allProducts[index].images[0] = imageUrl;
    }
  } else {
    // Add new product
    const newProduct = {
      id: Math.max(...allProducts.map((p) => p.id)) + 1,
      title: title,
      slug: title.toLowerCase().replace(/\s+/g, "-"),
      price: price,
      description: description,
      category: {
        id: 1,
        name: categoryName,
        slug: categoryName.toLowerCase().replace(/\s+/g, "-"),
      },
      images: [imageUrl],
      creationAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    allProducts.push(newProduct);
  }

  filteredProducts = [...allProducts];
  currentPage = 1;
  renderProducts();

  // Close modal
  const modal = bootstrap.Modal.getInstance(
    document.getElementById("productModal"),
  );
  modal.hide();
}

// ============ DELETE PRODUCT ============
function deleteProduct(id) {
  if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
    allProducts = allProducts.filter((p) => p.id !== id);
    filteredProducts = [...allProducts];

    // Adjust current page if needed
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = totalPages;
    }

    renderProducts();
  }
}

// ============ INITIALIZE ============
LoadData();
