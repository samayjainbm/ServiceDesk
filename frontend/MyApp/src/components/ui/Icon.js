// src/components/ui/Icon.js
// Crisp vector icons via lucide-react-native (backed by react-native-svg).
// Keeps the same `name` API the whole app already uses, so every screen
// inherits real icons with zero per-screen changes.
import React from 'react';
import { View } from 'react-native';
import {
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Plus, Minus, Check, CheckCircle2,
  X, Search, RefreshCw, Bell, User, Users, LogOut, Lock, Mail, Eye, EyeOff, Home,
  Package, ClipboardList, List, LayoutGrid, Info, AlertTriangle, Sun, Moon, Settings,
  Calendar, Send, Tag, Circle,
} from 'lucide-react-native';
import { useTheme } from '../../theme';

const MAP = {
  chevronRight: ChevronRight, chevronLeft: ChevronLeft, back: ChevronLeft,
  chevronUp: ChevronUp, chevronDown: ChevronDown,
  plus: Plus, minus: Minus, check: Check, checkCircle: CheckCircle2, close: X,
  search: Search, refresh: RefreshCw, bell: Bell, user: User, users: Users,
  logout: LogOut, lock: Lock, mail: Mail, eye: Eye, eyeOff: EyeOff, home: Home,
  box: Package, clipboard: ClipboardList, list: List, grid: LayoutGrid,
  info: Info, alert: AlertTriangle, sun: Sun, moon: Moon, settings: Settings,
  calendar: Calendar, send: Send, tag: Tag,
};

export default function Icon({ name, size = 22, color, strokeWidth = 2.1, style }) {
  const { colors } = useTheme();
  const c = color || colors.textPrimary;

  // Filled status dot (crisp, not an outline glyph).
  if (name === 'dot') {
    return <View style={[{ width: size * 0.42, height: size * 0.42, borderRadius: size, backgroundColor: c }, style]} />;
  }

  const Cmp = MAP[name] || Circle;
  return <Cmp size={size} color={c} strokeWidth={strokeWidth} style={style} />;
}
