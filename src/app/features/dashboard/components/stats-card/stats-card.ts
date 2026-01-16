import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type StatsCardTheme = 'purple' | 'green' | 'yellow' | 'red';

@Component({
  selector: 'app-stats-card',
  imports: [CommonModule],
  templateUrl: './stats-card.html',
  styleUrl: './stats-card.css',
})
export class StatsCard {
  @Input({ required: true }) title!: string;
  @Input({ required: true }) value!: number;
  @Input({ required: true }) subtitle!: string;
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) theme!: StatsCardTheme;
  @Input() subtitleColor?: string;

  // Theme-based CSS classes
  get iconBgClass(): string {
    const bgClasses: Record<StatsCardTheme, string> = {
      purple: 'bg-purple-100',
      green: 'bg-green-100',
      yellow: 'bg-yellow-100',
      red: 'bg-red-100'
    };
    return bgClasses[this.theme];
  }

  get iconColorClass(): string {
    const colorClasses: Record<StatsCardTheme, string> = {
      purple: 'text-purple-600',
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600'
    };
    return colorClasses[this.theme];
  }

  get subtitleColorClass(): string {
    // If custom subtitleColor provided, use it; otherwise use theme color
    if (this.subtitleColor) {
      return this.subtitleColor;
    }
    const colorClasses: Record<StatsCardTheme, string> = {
      purple: 'text-gray-400', // Default for purple is neutral gray
      green: 'text-green-600',
      yellow: 'text-yellow-600',
      red: 'text-red-600'
    };
    return colorClasses[this.theme];
  }
}
