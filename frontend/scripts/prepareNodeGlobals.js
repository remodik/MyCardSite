function createStorageStub() {
  const store = new Map();

  return {
    getItem(key) {
      const value = store.get(String(key));
      return value === undefined ? null : value;
    },
    setItem(key, value) {
      store.set(String(key), String(value));
    },
    removeItem(key) {
      store.delete(String(key));
    },
    clear() {
      store.clear();
    },
    key(index) {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };
}

function defineLocalStorageStub() {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    enumerable: false,
    writable: true,
    value: createStorageStub(),
  });
}

function ensureLocalStorage() {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  if (descriptor) {
    if (!descriptor.get && descriptor.value) {
      return;
    }

    try {
        if (globalThis.localStorage) {
        return;
      }
    } catch (error) {
      defineLocalStorageStub();
      return;
    }

    defineLocalStorageStub();
    return;
  }

  if (typeof globalThis.localStorage === 'undefined') {
    defineLocalStorageStub();
  }
}

ensureLocalStorage();