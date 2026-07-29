export const uid = () => Math.random().toString(36).slice(2);
export const makeEdu    = () => ({ id:uid(), institution:'', degree:'', field:'', location:'', startDate:'', endDate:'', gpa:'', coursework:'' });
export const makeExp    = () => ({ id:uid(), title:'', company:'', location:'', startDate:'', endDate:'', current:false, responsibilities:'' });
export const makeProj   = () => ({ id:uid(), name:'', tech:'', repo:'', live:'', startDate:'', endDate:'', desc:'' });
export const makeCert   = () => ({ id:uid(), name:'', org:'', issueDate:'', credUrl:'', certPdf:null });
export const makeAward  = () => ({ id:uid(), name:'', org:'', year:'' });
export const makeLeader = () => ({ id:uid(), position:'', org:'', duration:'', desc:'' });
export const makeVol    = () => ({ id:uid(), org:'', role:'', duration:'', desc:'' });
export const makePub    = () => ({ id:uid(), title:'', conference:'', year:'', link:'' });

/* ── Generic list helpers ── */
export const updateList = setter => (id, field, val) =>
  setter(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
export const addItem    = (setter, maker) => () => setter(prev => [...prev, maker()]);
export const removeItem = setter => id => setter(prev => prev.filter(item => item.id !== id));
