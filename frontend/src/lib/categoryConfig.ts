import {
  BookOpen,
  Video,
  Lightbulb,
  CheckSquare,
  Users,
  FileText,
  Target,
  ShoppingCart,
  MapPin,
  BookMarked,
  GraduationCap,
  Bookmark,
} from 'lucide-react';
import type { Category } from '@/lib/api';

export interface CategoryInfo {
  icon: typeof BookOpen;
  label: string;
  color: string;
  bgColor: string;
}

export const categoryConfig: Record<Category, CategoryInfo> = {
  read: { icon: BookOpen, label: 'Read', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  watch: { icon: Video, label: 'Watch', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  ideas: { icon: Lightbulb, label: 'Ideas', color: 'text-[#C9A030]', bgColor: 'bg-[#FACE68]/15 border-[#FACE68]/30' },
  tasks: { icon: CheckSquare, label: 'Tasks', color: 'text-[#D65E3F]', bgColor: 'bg-[#FF8364]/10 border-[#FF8364]/30' },
  people: { icon: Users, label: 'People', color: 'text-[#C44545]', bgColor: 'bg-[#EA7B7B]/10 border-[#EA7B7B]/30' },
  notes: { icon: FileText, label: 'Notes', color: 'text-[#5EB563]', bgColor: 'bg-[#93DA97]/10 border-[#93DA97]/30' },
  goals: { icon: Target, label: 'Goals', color: 'text-[#C9A030]', bgColor: 'bg-[#FACE68]/15 border-[#FACE68]/30' },
  buy: { icon: ShoppingCart, label: 'Buy', color: 'text-[#C44545]', bgColor: 'bg-[#EA7B7B]/10 border-[#EA7B7B]/30' },
  places: { icon: MapPin, label: 'Places', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  journal: { icon: BookMarked, label: 'Journal', color: 'text-[#5EB563]', bgColor: 'bg-[#93DA97]/10 border-[#93DA97]/30' },
  learn: { icon: GraduationCap, label: 'Learn', color: 'text-[#5AACA8]', bgColor: 'bg-[#79C9C5]/10 border-[#79C9C5]/30' },
  save: { icon: Bookmark, label: 'Saved', color: 'text-[#C44545]', bgColor: 'bg-[#EA7B7B]/10 border-[#EA7B7B]/30' },
};
