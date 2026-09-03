import os
import sys
import json
import argparse
import matplotlib.pyplot as plt
import matplotlib.patches as patches

def generate_activity_chart(labels, hours, output_path, total_hours=None, title="Distribución por Tipo de Actividad", subtitle=None):
    if not total_hours:
        total_hours = sum(hours)
    
    if not subtitle:
        subtitle = f"Distribución General de Horas por Actividad ({total_hours:.1f} hs)"
        
    palette = ['#B57912', '#234FAF', '#1E88E5', '#1B8C5A', '#8B5CF6', '#EC4899']
    colors = palette[:len(hours)]
    
    fig, ax = plt.subplots(figsize=(8.5, 5.6), dpi=250)
    fig.patch.set_alpha(0.0)
    ax.patch.set_alpha(0.0)
    
    # Pie chart
    wedges, texts, autotexts = ax.pie(
        hours,
        autopct='%1.0f%%',
        startangle=90,
        colors=colors,
        wedgeprops={'edgecolor': '#FFFFFF', 'linewidth': 2.2},
        pctdistance=0.68,
        textprops={'fontsize': 12, 'color': '#FFFFFF', 'weight': 'bold', 'fontfamily': 'DejaVu Sans'}
    )
    
    ax.set_position([0.04, 0.08, 0.54, 0.72])
    
    # Custom tag icon at top-left
    tag_color = '#B57912'
    tag = patches.Polygon(
        [[0.062, 0.94], [0.080, 0.94], [0.092, 0.925], [0.080, 0.91], [0.062, 0.91]],
        closed=True, facecolor=tag_color, edgecolor='none', transform=fig.transFigure
    )
    fig.patches.append(tag)
    hole = patches.Circle((0.067, 0.925), 0.0035, facecolor='#FFFFFF', edgecolor='none', transform=fig.transFigure)
    fig.patches.append(hole)
    
    # Title and subtitle
    fig.text(0.103, 0.913, title, color='#003366', fontsize=16, weight='bold', fontfamily='DejaVu Sans')
    fig.text(0.062, 0.852, subtitle, color='#555555', fontsize=12.5, fontfamily='DejaVu Sans')
    
    # Legend
    legend_labels = [
        f'{l}\n({h:.1f} hs - {h/total_hours*100:.1f}%)'
        for l, h in zip(labels, hours)
    ]
    legend_elements = [plt.Rectangle((0,0), 1, 1, facecolor=c, edgecolor='none') for c in colors]
    fig.legend(
        legend_elements,
        legend_labels,
        loc='center left',
        bbox_to_anchor=(0.58, 0.46),
        frameon=False,
        fontsize=11,
        labelcolor='#222222',
        handlelength=1.4,
        handleheight=1.4,
        handletextpad=1.0,
        labelspacing=1.3
    )
    
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    plt.savefig(output_path, transparent=True, bbox_inches='tight', pad_inches=0.3)
    plt.close(fig)
    print(f"Chart successfully saved to: {output_path}")

def main():
    parser = argparse.ArgumentParser(description="Generate transparent activity distribution pie chart.")
    parser.add_argument("--json", type=str, help="JSON file path or raw JSON string with chart data")
    parser.add_argument("--hours", type=str, help="Comma-separated hours (e.g. 5.0,3.0,2.0,1.5)")
    parser.add_argument("--labels", type=str, help="Comma-separated labels")
    parser.add_argument("--total", type=float, help="Total hours override")
    parser.add_argument("--output", type=str, required=True, help="Output PNG file path")
    parser.add_argument("--title", type=str, default="Distribución por Tipo de Actividad", help="Chart title")
    parser.add_argument("--subtitle", type=str, default=None, help="Chart subtitle")
    
    args = parser.parse_args()
    
    if args.json:
        if os.path.exists(args.json):
            with open(args.json, 'r', encoding='utf-8') as f:
                data = json.load(f)
        else:
            data = json.loads(args.json)
        hours = data.get("hours", [])
        labels = data.get("labels", [])
        total = data.get("total", sum(hours))
        title = data.get("title", args.title)
        subtitle = data.get("subtitle", args.subtitle)
    else:
        hours = [float(h.strip()) for h in args.hours.split(',')]
        labels = [l.strip() for l in args.labels.split(',')]
        total = args.total if args.total else sum(hours)
        title = args.title
        subtitle = args.subtitle

    generate_activity_chart(labels, hours, args.output, total, title, subtitle)

if __name__ == "__main__":
    main()
