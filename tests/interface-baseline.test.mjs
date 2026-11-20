import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { inspectInterface } from '../skills/piano-keyboard/scripts/audit_interface.mjs';
const root=new URL('../skills/piano-keyboard/',import.meta.url);
test('installed skill carries concrete visual recipe, CSS, and browser audit',async()=>{
  for(const name of ['references/baseline-recipe.md','assets/interface/baseline.css','scripts/audit_interface.mjs'])await access(new URL(name,root));
  const entry=await readFile(new URL('SKILL.md',root),'utf8');
  assert.match(entry,/references\/baseline-recipe.md/);
  const recipe=await readFile(new URL('references/baseline-recipe.md',root),'utf8');
  for(const token of ['2560×1440','248px','300px','260px','120ms','即将推出','未执行浏览器验收'])assert.ok(recipe.includes(token),token);
  const copy=await readFile(new URL('../scripts/copy_skill.ps1',import.meta.url),'utf8');
  assert.ok(copy.includes("'assets/interface'"));
});
test('browser inspector checks rendered geometry and keys, not source token presence',()=>{
  const source=inspectInterface.toString();
  for(const token of ['getBoundingClientRect','getComputedStyle','===45','===35','===61','===36','===25','Math.min(6,cards.length)','e.disabled'])assert.ok(source.includes(token),token);
});
