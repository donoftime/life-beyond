const lifeBeyond = async () => {
  const character = await fetchCharacter();
  const lifeDomain = character.classes.filter((charClass) => charClass.subclassDefinition.name == 'Life Domain')[0];
  if (lifeDomain == null) {
    return;  // nothing to do here
  }
  await new Promise(resolve => setTimeout(resolve, 3000));
  watchForSpellBookUpdates(lifeDomain);
}

const fetchCharacter = async () => {
  try {
    const characterSheet = document.querySelector('#character-sheet-target');
    const url = characterSheet.getAttribute('data-character-endpoint');
    const response = await fetch(url);
    const data = await response.json();
    return data.character;
  } catch (e) {
    console.error('[Life Beyond] An error occurred when fetching character sheet: ' + e);
  }
}

const watchForSpellBookUpdates = (lifeDomain) => {
  const observer = new MutationObserver(addBonusesToHealingSpells(lifeDomain));
  const sidebar = document.querySelector('.ct-sidebar__portal');
  const observerConfig = { childList: true, subtree: true, characterData: true };
  observer.observe(sidebar, observerConfig);
}

const addBonusesToHealingSpells = (lifeDomain) => {
  return (mutation) => {
    const spellTags = document.querySelector('.ct-spell-detail__tags-list');
    if (spellTags == null) {
      return;  // the spell book isn't open, so nothing to do
    }

    const healingSpell = [].slice.call(spellTags.children).some((tag) => tag.textContent == 'Healing');
    if (!healingSpell) {
      return;  // bonuses only apply to healing spells
    }

    const spellLevelText = document.querySelector('.ct-spell-caster__casting-level-current.ct-spell-caster__casting-level-current--controls');
    if (spellLevelText == null) {
      return;
    }

    const spellLevel = spellLevelText.textContent.match(/\d+/)[0]
    if (spellLevel < 1) {
      return;  // bonuses only apply to spells level 1 and higher
    }

    addDiscipleOfLifeBonus(spellLevel);

    if (lifeDomain.level >= 6) {
      addBlessedHealerBonus(spellLevel);
    }
  }
}

const addDiscipleOfLifeBonus = (spellLevel) => {
  add(
    'Regain 2+' + spellLevel + ' Hit Points (Disciple of Life)',
    'life-beyond__dl',
    spellLevel
  );
}

const addBlessedHealerBonus = (spellLevel) => {
  add(
    'You regain 2+' + spellLevel + ' Hit Points when spell restores HP to a creature other than you (Blessed Healer)',
    'life-beyond_bh',
    spellLevel
  )
}

const add = (bonusText, bonusClass, spellLevel) => {
  const existingBonus = document.querySelector('.' + bonusClass);
  const existingBonusAtThisLevel = document.querySelector('.' + bonusClass + '-' + spellLevel);

  if (existingBonusAtThisLevel) {
    return;  // spellbook is already updated, nothing to do
  }

  if (existingBonus) {
    existingBonus.remove();  // the level was changed, need to clean out the old entries
  }

  const heal = document.querySelector('.ct-spell-caster__modifiers.ct-spell-caster__modifiers--healing');
  const bonus = heal.cloneNode(true);
  bonus.querySelector('.ct-spell-caster__modifier-amount').textContent = bonusText;
  bonus.className = bonus.className + ' ' + bonusClass + ' ' + bonusClass + '-' + spellLevel;
  heal.parentNode.append(bonus);
}

lifeBeyond();
