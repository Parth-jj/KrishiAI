import { User as FirebaseUser } from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestoreDb, handleFirestoreError, OperationType } from "../firebase.js";
import { Farm, QueryRecord, User } from "../types/index.js";

export interface FirestoreFarmTask {
  id: string;
  title: string;
  crop: string;
  dueDate: string;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

function clampString(val: unknown, maxLen: number, fallback = ""): string {
  const str = typeof val === "string" ? val.trim() : fallback;
  return str.slice(0, maxLen);
}

function clampStringList(items: unknown[], maxItems: number, maxLen: number): string[] {
  return items
    .map((item) => clampString(String(item ?? ""), maxLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

function toIsoString(ts: unknown): string {
  if (ts instanceof Timestamp) {
    return ts.toDate().toISOString();
  }
  if (typeof ts === "string") return ts;
  return new Date().toISOString();
}

export async function ensureFirebaseUserDocuments(
  fbUser: FirebaseUser,
  preferredLanguage: string = "en"
): Promise<{ user: User; farm: Farm }> {
  const uid = fbUser.uid;
  const userPath = `users/${uid}`;
  const privatePath = `users/${uid}/private/info`;
  const farmPath = `users/${uid}/farms/primary`;

  const userRef = doc(firestoreDb, "users", uid);
  const privateRef = doc(firestoreDb, "users", uid, "private", "info");
  const farmRef = doc(firestoreDb, "users", uid, "farms", "primary");

  let userData: Record<string, any> | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      userData = snap.data();
    } else {
      const lang = ["en", "hi", "te"].includes(preferredLanguage) ? preferredLanguage : "en";
      const payload = {
        uid,
        name: clampString(fbUser.displayName || fbUser.email?.split("@")[0] || "Farmer", 120, "Farmer"),
        role: "farmer",
        preferredLanguage: lang,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(userRef, payload);
      const created = await getDoc(userRef);
      userData = created.data() || payload;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }

  let privateData: Record<string, any> | null = null;
  try {
    const privSnap = await getDoc(privateRef);
    if (privSnap.exists()) {
      privateData = privSnap.data();
    } else {
      const privPayload = {
        userId: uid,
        email: clampString(fbUser.email || "", 200, "farmer@krishiai.in"),
        phone: clampString(fbUser.phoneNumber || "", 40),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(privateRef, privPayload);
      const createdPriv = await getDoc(privateRef);
      privateData = createdPriv.data() || privPayload;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, privatePath);
  }

  let farmData: Record<string, any> | null = null;
  try {
    const farmSnap = await getDoc(farmRef);
    if (farmSnap.exists()) {
      farmData = farmSnap.data();
    } else {
      const defaultFarmPayload = {
        userId: uid,
        state: "Andhra Pradesh",
        district: "Guntur",
        village: "",
        farmSizeAcres: 2.5,
        crop: "Cotton",
        sowingDate: "",
        soilType: "Black Cotton Soil",
        irrigationSource: "Canal / Borewell",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(farmRef, defaultFarmPayload);
      const createdFarm = await getDoc(farmRef);
      farmData = createdFarm.data() || defaultFarmPayload;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, farmPath);
  }

  const user: User = {
    id: uid,
    name: userData?.name || fbUser.displayName || "Farmer",
    email: privateData?.email || fbUser.email || "",
    phone: privateData?.phone || "",
    role: userData?.role === "admin" ? "admin" : "farmer",
    preferredLanguage: userData?.preferredLanguage || "en",
    createdAt: toIsoString(userData?.createdAt),
  };

  const farm: Farm = {
    id: "primary",
    userId: uid,
    state: farmData?.state || "Andhra Pradesh",
    district: farmData?.district || "Guntur",
    village: farmData?.village || "",
    farmSizeAcres: Number(farmData?.farmSizeAcres ?? 2.5),
    crop: farmData?.crop || "Cotton",
    sowingDate: farmData?.sowingDate || "",
    soilType: farmData?.soilType || "Black Cotton Soil",
    irrigationSource: farmData?.irrigationSource || "Canal / Borewell",
    createdAt: toIsoString(farmData?.createdAt),
    updatedAt: toIsoString(farmData?.updatedAt),
  };

  return { user, farm };
}

export async function saveFarmToFirestore(uid: string, farmInput: Partial<Farm>): Promise<Farm> {
  const farmPath = `users/${uid}/farms/primary`;
  const farmRef = doc(firestoreDb, "users", uid, "farms", "primary");

  try {
    const snap = await getDoc(farmRef);
    const updatePayload = {
      state: clampString(farmInput.state, 80, "Andhra Pradesh"),
      district: clampString(farmInput.district, 80, "Guntur"),
      village: clampString(farmInput.village, 100),
      farmSizeAcres: Math.min(100000, Math.max(0, Number(farmInput.farmSizeAcres ?? 2.5) || 0)),
      crop: clampString(farmInput.crop, 60, "Cotton"),
      sowingDate: clampString(farmInput.sowingDate, 32),
      soilType: clampString(farmInput.soilType, 80, "Alluvial Soil"),
      irrigationSource: clampString(farmInput.irrigationSource, 80, "Canal / Borewell"),
      updatedAt: serverTimestamp(),
    };

    if (snap.exists()) {
      await updateDoc(farmRef, updatePayload);
    } else {
      await setDoc(farmRef, {
        userId: uid,
        ...updatePayload,
        createdAt: serverTimestamp(),
      });
    }

    const updatedSnap = await getDoc(farmRef);
    const data: Record<string, any> = updatedSnap.data() || updatePayload;
    return {
      id: "primary",
      userId: uid,
      state: data.state,
      district: data.district,
      village: data.village || "",
      farmSizeAcres: Number(data.farmSizeAcres),
      crop: data.crop,
      sowingDate: data.sowingDate || "",
      soilType: data.soilType,
      irrigationSource: data.irrigationSource,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, farmPath);
  }
}

export async function saveQueryToFirestore(uid: string, record: QueryRecord): Promise<void> {
  const safeId = (record.id || `q-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  const queryPath = `users/${uid}/queries/${safeId}`;
  const queryRef = doc(firestoreDb, "users", uid, "queries", safeId);

  try {
    const lang = ["en", "hi", "te"].includes(record.language) ? record.language : "en";
    const conf = ["low", "medium", "high"].includes(record.confidence) ? record.confidence : "medium";

    const payload: Record<string, any> = {
      userId: uid,
      farmerName: clampString(record.farmerName, 120, "Farmer"),
      question: clampString(record.question, 2000, "Crop query"),
      detectedCrop: clampString(record.detectedCrop, 60, "General Agriculture"),
      detectedIntent: clampString(record.detectedIntent, 60, "general_agriculture"),
      confidence: conf,
      language: lang,
      problem: clampString(record.advisory?.problem, 500, "Agricultural advisory"),
      likelyCauses: clampStringList(record.advisory?.likely_causes || [], 10, 1000),
      recommendationTitles: clampStringList(
        (record.advisory?.recommendations || []).map((r) => r.title),
        10,
        1000
      ),
      recommendationDetails: clampStringList(
        (record.advisory?.recommendations || []).map((r) =>
          r.dosage ? `${r.description} (Dosage: ${r.dosage})` : r.description
        ),
        10,
        1000
      ),
      precautions: clampStringList(record.advisory?.precautions || [], 10, 1000),
      sourceTitles: clampStringList(
        (record.advisory?.sources || []).map((s) => `${s.title} — ${s.source}`),
        10,
        1000
      ),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (record.selectedCrop) {
      payload.selectedCrop = clampString(record.selectedCrop, 60);
    }
    if (record.advisory?.engineUsed) {
      payload.engineUsed = clampString(record.advisory.engineUsed, 160);
    }

    await setDoc(queryRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, queryPath);
  }
}

export async function loadQueriesFromFirestore(uid: string): Promise<QueryRecord[]> {
  const queriesPath = `users/${uid}/queries`;
  try {
    const q = query(collection(firestoreDb, "users", uid, "queries"), where("userId", "==", uid));
    const snap = await getDocs(q);
    const records: QueryRecord[] = snap.docs.map((d) => {
      const data = d.data();
      const recTitles: string[] = Array.isArray(data.recommendationTitles) ? data.recommendationTitles : [];
      const recDetails: string[] = Array.isArray(data.recommendationDetails) ? data.recommendationDetails : [];
      const sourceTitles: string[] = Array.isArray(data.sourceTitles) ? data.sourceTitles : [];

      return {
        id: d.id,
        userId: data.userId,
        farmerName: data.farmerName || "Farmer",
        question: data.question || "",
        selectedCrop: data.selectedCrop,
        detectedCrop: data.detectedCrop || "General Agriculture",
        detectedIntent: data.detectedIntent || "general_agriculture",
        confidence: data.confidence || "medium",
        language: data.language || "en",
        createdAt: toIsoString(data.createdAt),
        extractedContext: {
          crop: data.detectedCrop || null,
          problem: data.problem || "",
          symptoms: [],
          category: data.detectedIntent || "general_agriculture",
          confidence: data.confidence || "medium",
          language: data.language || "en",
        },
        retrievedChunks: [],
        feedback:
          typeof data.feedbackUseful === "boolean"
            ? {
                isUseful: data.feedbackUseful,
                comment: data.feedbackComment,
                submittedAt: toIsoString(data.updatedAt),
              }
            : undefined,
        advisory: {
          crop: data.detectedCrop || "General Agriculture",
          problem: data.problem || "",
          likely_causes: Array.isArray(data.likelyCauses) ? data.likelyCauses : [],
          recommendations: recTitles.map((title, idx) => ({
            title,
            description: recDetails[idx] || "",
            type: "agronomic" as const,
          })),
          precautions: Array.isArray(data.precautions) ? data.precautions : [],
          follow_up_questions: [],
          confidence: data.confidence || "medium",
          engineUsed: data.engineUsed,
          sources: sourceTitles.map((entry) => {
            const [title, source] = entry.split(" — ");
            return {
              title: title || entry,
              source: source || "ICAR Knowledge Base",
              relevance: "Verified ICAR Source",
            };
          }),
        },
      };
    });

    return records.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, queriesPath);
  }
}

export async function saveQueryFeedbackToFirestore(
  uid: string,
  queryId: string,
  isUseful: boolean,
  comment?: string
): Promise<void> {
  const safeId = queryId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  const queryPath = `users/${uid}/queries/${safeId}`;
  try {
    const queryRef = doc(firestoreDb, "users", uid, "queries", safeId);
    const snap = await getDoc(queryRef);
    if (!snap.exists()) return;

    const payload: Record<string, any> = {
      feedbackUseful: Boolean(isUseful),
      updatedAt: serverTimestamp(),
    };
    if (comment && comment.trim()) {
      payload.feedbackComment = clampString(comment, 500);
    }
    await updateDoc(queryRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, queryPath);
  }
}

export async function loadTasksFromFirestore(uid: string): Promise<FirestoreFarmTask[]> {
  const tasksPath = `users/${uid}/tasks`;
  try {
    const q = query(collection(firestoreDb, "users", uid, "tasks"), where("userId", "==", uid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        title: data.title || "",
        crop: data.crop || "Cotton",
        dueDate: data.dueDate || "Today",
        completed: Boolean(data.completed),
        priority: (["high", "medium", "low"].includes(data.priority) ? data.priority : "medium") as
          | "high"
          | "medium"
          | "low",
      };
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, tasksPath);
  }
}

export async function createTaskInFirestore(
  uid: string,
  task: Omit<FirestoreFarmTask, "id"> & { id?: string }
): Promise<FirestoreFarmTask> {
  const taskId = (task.id || `task-${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  const taskPath = `users/${uid}/tasks/${taskId}`;
  try {
    const taskRef = doc(firestoreDb, "users", uid, "tasks", taskId);
    const payload = {
      userId: uid,
      title: clampString(task.title, 240, "Farm task"),
      crop: clampString(task.crop, 60, "Cotton"),
      dueDate: clampString(task.dueDate, 60, "Today"),
      completed: Boolean(task.completed),
      priority: ["high", "medium", "low"].includes(task.priority) ? task.priority : "medium",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(taskRef, payload);
    return {
      id: taskId,
      title: payload.title,
      crop: payload.crop,
      dueDate: payload.dueDate,
      completed: payload.completed,
      priority: payload.priority as "high" | "medium" | "low",
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, taskPath);
  }
}

export async function toggleTaskInFirestore(
  uid: string,
  taskId: string,
  completed: boolean
): Promise<void> {
  const safeId = taskId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  const taskPath = `users/${uid}/tasks/${safeId}`;
  try {
    await updateDoc(doc(firestoreDb, "users", uid, "tasks", safeId), {
      completed: Boolean(completed),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, taskPath);
  }
}

export async function deleteTaskFromFirestore(uid: string, taskId: string): Promise<void> {
  const safeId = taskId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  const taskPath = `users/${uid}/tasks/${safeId}`;
  try {
    await deleteDoc(doc(firestoreDb, "users", uid, "tasks", safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, taskPath);
  }
}
