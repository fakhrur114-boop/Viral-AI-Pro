```react
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, addDoc, onSnapshot, doc, 
  setDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  onAuthStateChanged, signOut 
} from 'firebase/auth';
import { Video, Key, Zap, Loader2, Play, Trash2, History, LogOut, ShieldCheck, Clock, Download } from 'lucide-react';

// --- ID SALURAN (Sesuai dengan worker.py kamu) ---
const APP_ID = "viral-ai-pro-v1"; 

const firebaseConfig = {
  apiKey: "AIzaSyAPfaRXhA8FulUtOogR7roVRv_nAW8i4GM",
  authDomain: "sabena-digital-a0774.firebaseapp.com",
  projectId: "sabena-digital-a0774",
  storageBucket: "sabena-digital-a0774.firebasestorage.app",
  messagingSenderId: "311595817027",
  appId: "1:311595817027:web:5de50b20682ff0715bdcf6",
  measurementId: "G-3G2NTVN8RR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [image, setImage] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('user_api_token') || "");
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(db, 'artifacts', APP_ID, 'users', currentUser.uid, 'profile');
        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            setDoc(userDocRef, { email: currentUser.email, isApproved: false, createdAt: Date.now() });
          }
          setAuthLoading(false);
        });
      } else {
        setUserData(null);
        setAuthLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user || !userData?.isApproved) return;
    const q = collection(db, 'artifacts', APP_ID, 'public', 'data', 'jobs');
    return onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setJobs(list.filter(j => j.userId === user.uid).sort((a,b) => b.createdAt - a.createdAt));
    });
  }, [user, userData]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (isLogin) await signInWithEmailAndPassword(auth, email, password);
      else await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) { alert("Ralat: " + err.message); setAuthLoading(false); }
  };

  const createVideo = async () => {
    if (!apiKey) return alert("Sila masukkan Replicate API Token!");
    if (!image) return alert("Pilih foto!");
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', APP_ID, 'public', 'data', 'jobs'), {
        userId: user.uid,
        image,
        status: 'queued',
        userToken: apiKey,
        createdAt: Date.now()
      });
      setImage(null);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5">
          <div className="text-center mb-8">
            <Zap className="w-12 h-12 text-indigo-500 mx-auto mb-4 fill-current" />
            <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">ViralAI Pro</h2>
          </div>
          <form onSubmit={handleAuth} className="space-y-4">
            <input type="email" placeholder="Email" required className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-indigo-500" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password" placeholder="Password" required className="w-full bg-black border border-white/5 p-4 rounded-2xl text-white outline-none focus:border-indigo-500" value={password} onChange={e => setPassword(e.target.value)} />
            <button className="w-full py-4 bg-white text-black font-black rounded-2xl uppercase tracking-widest">{isLogin ? 'Log In' : 'Daftar'}</button>
          </form>
          <p className="text-center text-[10px] mt-6 text-zinc-500 font-bold cursor-pointer" onClick={() => setIsLogin(!isLogin)}>{isLogin ? 'BELUM ADA AKAUN? DAFTAR' : 'SUDAH ADA AKAUN? LOGIN'}</p>
        </div>
      </div>
    );
  }

  if (userData && !userData.isApproved) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 text-center">
        <Clock className="w-16 h-16 text-amber-500 mb-6 animate-pulse" />
        <h2 className="text-xl font-bold text-white mb-2">Menunggu Izin Admin</h2>
        <p className="text-zinc-500 text-sm mb-8 leading-relaxed">Akun Anda sedang ditinjau. Silakan hubungi Admin untuk mengaktifkan akses.</p>
        <button onClick={() => signOut(auth)} className="text-indigo-500 text-xs font-bold underline">Logout</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 p-4 md:p-10 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-green-500 w-6 h-6" />
            <h1 className="text-white font-black italic tracking-tighter uppercase">VIRALAI.PRO</h1>
          </div>
          <button onClick={() => signOut(auth)} className="p-3 bg-zinc-900 rounded-xl"><LogOut className="w-4 h-4" /></button>
        </header>

        <div className="bg-zinc-900 p-8 rounded-[2.5rem] border border-white/5 mb-8 shadow-2xl">
          <label className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest block mb-4 px-1">Replicate API Token</label>
          <input type="password" value={apiKey} onChange={e => {setApiKey(e.target.value); localStorage.setItem('user_api_token', e.target.value);}} className="w-full bg-black border border-white/5 p-4 rounded-2xl text-[10px] text-white focus:border-indigo-500 outline-none" placeholder="r8_..." />
          
          <label className="mt-8 aspect-video bg-black border-2 border-dashed border-zinc-800 rounded-3xl flex items-center justify-center mb-8 cursor-pointer relative overflow-hidden">
            {image ? <img src={image} className="absolute inset-0 w-full h-full object-cover" /> : <p className="text-[10px] font-bold text-zinc-800 uppercase tracking-widest">Klik Muat Naik Foto</p>}
            <input type="file" className="hidden" onChange={e => {
              const reader = new FileReader();
              reader.onload = (f) => setImage(f.target.result);
              reader.readAsDataURL(e.target.files[0]);
            }} />
          </label>

          <button onClick={createVideo} disabled={loading || !image} className="w-full py-5 bg-white text-black font-black rounded-3xl shadow-xl hover:bg-indigo-600 hover:text-white transition-all text-xs tracking-widest uppercase">
            {loading ? "MEMPROSES..." : "BUAT VIDEO AI"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(j => (
            <div key={j.id} className="bg-zinc-900 border border-white/5 p-4 rounded-3xl flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shrink-0">
                {j.status === 'completed' ? <Play className="w-5 h-5 text-indigo-500 fill-current" /> : <Loader2 className="w-4 h-4 animate-spin text-zinc-800" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${j.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>{j.status}</p>
                <p className="text-[10px] text-zinc-600 truncate">{new Date(j.createdAt).toLocaleTimeString()}</p>
              </div>
              <div className="flex gap-2">
                {j.status === 'completed' && j.videoUrl && (
                  <a href={j.videoUrl} target="_blank" rel="noopener noreferrer" className="p-3 bg-white/5 rounded-xl text-indigo-400"><Download className="w-4 h-4"/></a>
                )}
                <button onClick={() => deleteDoc(doc(db, 'artifacts', APP_ID, 'public', 'data', 'jobs', j.id))} className="p-3 text-zinc-800 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

```
