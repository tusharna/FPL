import { DEFAULT_DARK_THEME, DEFAULT_LIGHT_THEME, THEMES } from "@/lib/theme/types";
import { COOKIE_THEME_KEY, STORAGE_MODE_KEY, STORAGE_THEME_KEY } from "@/lib/theme/storage";

export function getAntiFoucScript(): string {
  const validIds = THEMES.map((theme) => `'${theme.id}'`).join(",");

  return `(function(){try{
    var DEFAULT_DARK='${DEFAULT_DARK_THEME}';
    var DEFAULT_LIGHT='${DEFAULT_LIGHT_THEME}';
    var valid=[${validIds}];
    function parseTheme(v){return valid.indexOf(v)>=0?v:DEFAULT_DARK;}
    function parseMode(v){return v==='dark'||v==='light'||v==='system'?v:'system';}
    function resolve(mode,activeThemeId,prefersDark){
      if(mode==='light')return DEFAULT_LIGHT;
      if(mode==='dark')return activeThemeId===DEFAULT_LIGHT?DEFAULT_DARK:activeThemeId;
      if(prefersDark)return activeThemeId===DEFAULT_LIGHT?DEFAULT_DARK:activeThemeId;
      return DEFAULT_LIGHT;
    }
    var mode=parseMode(localStorage.getItem('${STORAGE_MODE_KEY}'));
    var activeThemeId=parseTheme(localStorage.getItem('${STORAGE_THEME_KEY}'));
    var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolvedTheme=resolve(mode,activeThemeId,prefersDark);
    var isLight=resolvedTheme===DEFAULT_LIGHT;
    document.documentElement.setAttribute('data-theme',resolvedTheme);
    if(isLight){
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme='light';
    }else{
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      document.documentElement.style.colorScheme='dark';
    }
    document.cookie='${COOKIE_THEME_KEY}='+resolvedTheme+'; path=/; max-age=31536000; SameSite=Lax';
  }catch(e){}})();`;
}
