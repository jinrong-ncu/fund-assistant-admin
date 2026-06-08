import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss';

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      primary: {
        DEFAULT: '#2458c6',
        hover: '#1b449c',
        light: '#edf3ff',
        border: '#cbdaf6',
      },
      grayBg: '#f5f7fb',
      borderBase: '#dfe4ee',
      textMain: '#1d2433',
      textMuted: '#66738a',
    },
  },
  shortcuts: {
    // Layouts & Page Containers
    'app-shell-layout': 'grid grid-cols-[248px_minmax(0,1fr)] min-h-screen bg-[#f5f7fb]',
    'sidebar-panel': 'bg-[#172033] text-[#dce5f5] flex flex-col p-4.5 select-none',
    'sidebar-item': 'flex items-center gap-3 h-11.5 px-3 rounded-md text-[#b8c3d8] bg-transparent border-0 hover:bg-[#26344f] hover:text-white transition-all text-left text-[15px] font-medium w-full cursor-pointer',
    'sidebar-item-active': 'flex items-center gap-3 h-11.5 px-3 rounded-md text-white bg-[#26344f] text-[15px] font-semibold border-0 text-left w-full cursor-pointer',
    'card-base': 'bg-white border border-borderBase rounded-lg p-5.5 shadow-sm transition-all duration-200 hover:shadow-md',
    'metric-icon-wrap': 'w-10.5 h-10.5 rounded-lg bg-primary-light text-primary flex items-center justify-center transition-transform duration-200 hover:scale-105',

    // Buttons
    'btn-base': 'inline-flex items-center justify-center gap-1.5 h-8.5 px-3.5 rounded-md font-medium text-sm transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
    'btn-primary': 'btn-base bg-primary text-white hover:bg-primary-hover border border-transparent shadow-sm shadow-primary/10',
    'btn-secondary': 'btn-base bg-white border border-[#cfd7e6] text-[#28354a] hover:bg-gray-50 hover:border-[#b0bfd6]',
    'btn-icon': 'btn-base bg-white border border-[#d4dbea] text-[#34425b] p-0 w-8.5 h-8.5 hover:bg-gray-50 hover:border-[#b0bfd6]',
    'btn-link': 'bg-transparent border-0 text-primary p-0 h-auto justify-start hover:underline font-medium cursor-pointer',

    // Form Elements
    'input-base': 'bg-white border border-[#cfd7e6] rounded-md h-9.5 px-3 text-textMain text-sm outline-none transition-all focus:border-primary focus:ring-3 focus:ring-primary/15',

    // Reusable Table
    'table-container': 'bg-white border border-borderBase rounded-lg overflow-auto shadow-sm',
    'table-base': 'w-full min-w-180 border-collapse text-left',
    'table-th': 'bg-[#f8fafd] border-b border-[#edf0f6] px-4 py-3 text-xs font-semibold text-[#5f6b7d] whitespace-nowrap uppercase tracking-wider',
    'table-td': 'border-b border-[#edf0f6] px-4 py-3 text-xs text-[#263248] align-middle',
    'badge-primary': 'inline-flex items-center px-2.5 py-0.75 rounded-full text-xs font-medium bg-primary-light text-primary border border-primary-border/40',
  },
});
