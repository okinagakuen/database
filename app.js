import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDoA8xGJuKQWwGEsdf8Ajlh35flr_MQwnU",
  authDomain: "database-19d57.firebaseapp.com",
  projectId: "database-19d57",
  storageBucket: "database-19d57.firebasestorage.app",
  messagingSenderId: "471514777038",
  appId: "1:471514777038:web:83c04004cd252609aad79f",
  measurementId: "G-J74G28CB8R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const tblBody = document.getElementById("dataBody");
const detailModal = document.getElementById("detailModal");
const docIdInput = document.getElementById("docId");

let persons = [];
let currentFile = null;

// 初期読み込み（呼称番号順に取得）
async function loadData() {
  tblBody.innerHTML = "<tr><td colspan='6'>読み込み中...</td></tr>";
  try {
    const q = query(collection(db, "inmates"), orderBy("kosho", "asc"));
    const snapshot = await getDocs(q);
    persons = [];
    snapshot.forEach(document => {
      persons.push({ id: document.id, ...document.data() });
    });
    renderTable(persons);
  } catch (e) {
    alert("エラーが発生しました: " + e.message);
  }
}

// 表の描画
function renderTable(dataList) {
  tblBody.innerHTML = "";
  dataList.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.kosho}</td>
      <td>${p.sei} ${p.mei}</td>
      <td>${p.gender}</td>
      <td>${p.rank}</td>
      <td>${p.room}</td>
      <td>${p.factory}</td>
    `;
    // 行をクリックで詳細・編集画面を開く
    tr.onclick = () => openModal(p);
    tblBody.appendChild(tr);
  });
}

// モーダルの開閉
document.getElementById("btnNew").onclick = () => openModal();
document.getElementById("btnLoad").onclick = loadData;
document.getElementById("btnCancel").onclick = closeModal;

function openModal(p = null) {
  document.getElementById("photoInput").value = "";
  currentFile = null;

  if (p) {
    document.getElementById("modalTitle").innerText = "個人データ詳細 (編集)";
    docIdInput.value = p.id;
    document.getElementById("f_kosho").value = p.kosho || "";
    document.getElementById("f_sei").value = p.sei || "";
    document.getElementById("f_mei").value = p.mei || "";
    document.getElementById("f_seiKana").value = p.seiKana || "";
    document.getElementById("f_meiKana").value = p.meiKana || "";
    document.getElementById("f_gender").value = p.gender || "男";
    document.getElementById("f_blood").value = p.blood || "A型";
    document.getElementById("f_birth").value = p.birth || "";
    document.getElementById("f_rank").value = p.rank || "青";
    document.getElementById("f_height").value = p.height || "";
    document.getElementById("f_weight").value = p.weight || "";
    document.getElementById("f_period").value = p.period || "";
    document.getElementById("f_room").value = p.room || "";
    document.getElementById("f_factory").value = p.factory || "";
    document.getElementById("f_history").value = p.history || "";
    document.getElementById("photoPreview").src = p.photoUrl || "";
    document.getElementById("btnDelete").style.display = "inline-block";
  } else {
    document.getElementById("modalTitle").innerText = "個人データ詳細 (新規登録)";
    docIdInput.value = "";
    document.querySelectorAll(".form-right input:not([type='hidden']), .form-right textarea").forEach(el => el.value = "");
    document.getElementById("f_gender").value = "男";
    document.getElementById("f_blood").value = "A型";
    document.getElementById("f_rank").value = "青";
    document.getElementById("photoPreview").src = "";
    document.getElementById("btnDelete").style.display = "none";
  }
  detailModal.classList.remove("hidden");
}

function closeModal() {
  detailModal.classList.add("hidden");
}

// 写真プレビュー
document.getElementById("photoInput").onchange = (e) => {
  const file = e.target.files[0];
  if (file) {
    currentFile = file;
    const reader = new FileReader();
    reader.onload = (ev) => {
      document.getElementById("photoPreview").src = ev.target.result;
    }
    reader.readAsDataURL(file);
  }
};

// 登録・更新処理
document.getElementById("btnSave").onclick = async () => {
  const isUpdate = docIdInput.value !== "";
  
  const data = {
    kosho: Number(document.getElementById("f_kosho").value) || 0,
    sei: document.getElementById("f_sei").value,
    mei: document.getElementById("f_mei").value,
    seiKana: document.getElementById("f_seiKana").value,
    meiKana: document.getElementById("f_meiKana").value,
    gender: document.getElementById("f_gender").value,
    blood: document.getElementById("f_blood").value,
    birth: document.getElementById("f_birth").value,
    rank: document.getElementById("f_rank").value,
    height: Number(document.getElementById("f_height").value) || 0,
    weight: Number(document.getElementById("f_weight").value) || 0,
    period: document.getElementById("f_period").value,
    room: document.getElementById("f_room").value,
    factory: document.getElementById("f_factory").value,
    history: document.getElementById("f_history").value,
  };

  try {
    // 写真が選択されていればStorageにアップロード
    if (currentFile) {
      const fileRef = ref(storage, 'photos/' + new Date().getTime() + '_' + currentFile.name);
      await uploadBytes(fileRef, currentFile);
      data.photoUrl = await getDownloadURL(fileRef);
    } else if (isUpdate) {
      data.photoUrl = document.getElementById("photoPreview").src;
    }

    if (isUpdate) {
      await updateDoc(doc(db, "inmates", docIdInput.value), data);
    } else {
      await addDoc(collection(db, "inmates"), data);
    }
    closeModal();
    loadData();
  } catch(e) {
    alert("保存エラー: " + e.message);
  }
};

// 削除処理
document.getElementById("btnDelete").onclick = async () => {
  if(confirm("本当にこのデータを削除しますか？")) {
    try {
       await deleteDoc(doc(db, "inmates", docIdInput.value));
       closeModal();
       loadData();
    } catch(e) {
       alert("削除エラー: " + e.message);
    }
  }
};

// 検索機能（呼称番号、名前で絞り込み）
document.getElementById("btnSearch").onclick = () => {
   const keyword = document.getElementById("searchInput").value;
   const filtered = persons.filter(p => 
      String(p.kosho).includes(keyword) || 
      p.sei.includes(keyword) || 
      p.mei.includes(keyword) ||
      p.seiKana.includes(keyword) || 
      p.meiKana.includes(keyword)
   );
   renderTable(filtered);
};

// 起動時にデータを読み込む
window.onload = loadData;
