"""
Create a blank .blend file for an Assetto Corsa track project.

Usage (via Blender CLI):
    blender --background --python create-blend.py -- <output_path>

Usage (in Blender's script editor):
    Set OUTPUT_PATH at the top and run the script.
"""

import bpy
import sys
import os

OUTPUT_PATH = ""  # Override when running from Blender's script editor

def create_track_blend(output_path: str) -> None:
    # Set scene units to metric (meters), standard for AC track authoring
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    scene.unit_settings.scale_length = 1.0

    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(output_path))


if __name__ == "__main__":
    if "--" in sys.argv:
        output_path = sys.argv[sys.argv.index("--") + 1]
    elif OUTPUT_PATH:
        output_path = OUTPUT_PATH
    else:
        print("Error: no output path provided. Pass it after '--' or set OUTPUT_PATH.")
        sys.exit(1)

    create_track_blend(output_path)
