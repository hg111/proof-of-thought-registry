import sys
import os
import math
import argparse
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageChops

def create_global_emboss_layers(text_layer, base_image):
    """
    Generates global Shadow and Highlight layers from the flat text layer
    and composites them onto the base image.
    """
    # 1. Extract Alpha Channel as Mask
    mask = text_layer.split()[3]
    
    # 2. Create Shadow Layer (Black)
    # Blur slightly for rounded "minted" look
    shadow_mask = mask.filter(ImageFilter.GaussianBlur(1))
    shadow_img = Image.new('RGBA', text_layer.size, (0, 0, 0, 0))
    # Fill with black, use blurred mask for opacity
    # We want Shadow to be DARK (high opacity)
    black_fill = Image.new('RGBA', text_layer.size, (0, 0, 0, 220))
    shadow_img.paste(black_fill, (0,0), shadow_mask)
    
    # 3. Create Highlight Layer (White)
    # Less blur for sharper lip highlight
    highlight_mask = mask.filter(ImageFilter.GaussianBlur(0.5))
    highlight_img = Image.new('RGBA', text_layer.size, (0, 0, 0, 0))
    white_fill = Image.new('RGBA', text_layer.size, (255, 255, 255, 255))
    highlight_img.paste(white_fill, (0,0), highlight_mask)
    
    # 4. Composite
    # Shadow: Offset -2, -2 (Top Left)
    offset_shadow = ImageChops.offset(shadow_img, -2, -2)
    # Highlight: Offset +2, +2 (Bottom Right)
    offset_highlight = ImageChops.offset(highlight_img, 2, 2)
    
    # Paste Composite
    # We use alpha_composite for correct blending
    base_image.alpha_composite(offset_shadow)
    base_image.alpha_composite(offset_highlight)
    base_image.alpha_composite(text_layer)
    
    return base_image

def create_rotated_char_image(char, font, color, rotation, char_w):
    # Prepare canvas
    canvas_size = int(char_w * 5) if char_w > 0 else 100
    txt_img = Image.new('RGBA', (canvas_size, canvas_size), (255, 255, 255, 0))
    d = ImageDraw.Draw(txt_img)
    
    # Baseline Alignment
    cx = txt_img.width / 2
    cy = txt_img.height / 2
    
    stroke_w = 0
    if char in ['-', ':']:
        stroke_w = 1
        
    d.text((cx, cy), char, font=font, fill=color, anchor='ms', stroke_width=stroke_w, stroke_fill=color)
    
    # Rotate
    rotated_txt = txt_img.rotate(-rotation, resample=Image.BICUBIC, expand=1)
    return rotated_txt

def draw_text_on_arc(image, text, center, radius, position, font, text_color, manual_start_angle=None):
    """
    Draws text along an arc with GLOBAL lighting direction (Top-Left Light Source).
    """
    draw = ImageDraw.Draw(image)
    width, height = image.size
    cx, cy = center
    
    total_text_width = 0
    char_widths = []
    
    # Calculate total width (approximation)
    for char in text:
        try:
            bbox = font.getbbox(char)
            w = bbox[2] - bbox[0]
        except:
             w = font.getlength(char)
        char_widths.append(w)
        total_text_width += w

    total_angle_rad = total_text_width / radius
    kerning = 0.0014 # Reduced spacing further

    if position == 'top':
        # Text reads clockwise on top (standard)
        # Center on -90 degrees
        start_angle = -math.pi/2 - (total_angle_rad / 2) - ((len(text) * kerning) / 2)
        current_angle = start_angle
        
        for i, char in enumerate(text):
            char_w = char_widths[i]
            char_mid_angle = current_angle + (char_w / radius) / 2
            
            x = cx + radius * math.cos(char_mid_angle)
            y = cy + radius * math.sin(char_mid_angle)
            
            # Rotation: Tangent facing outward
            rotation_angle_deg = math.degrees(char_mid_angle) + 90
            
            img_main = create_rotated_char_image(char, font, text_color, rotation_angle_deg, char_w)
            paste_x = int(x - img_main.width / 2)
            paste_y = int(y - img_main.height / 2)
            image.paste(img_main, (paste_x, paste_y), img_main)

            current_angle += (char_w / radius) + kerning

    elif position == 'bottom':
        # Text reads Left-to-Right along the bottom (Readable upright)
        # Center on +90 degrees (math.pi/2)
        # Start at the LEFT side (Angle > 90) and move RIGHT (Angle < 90)
        
        if manual_start_angle is not None:
             start_angle = manual_start_angle
        else:
             start_angle = math.pi/2 + (total_angle_rad / 2) + ((len(text) * kerning) / 2)
             
        current_angle = start_angle
        
        for i, char in enumerate(text):
            char_w = char_widths[i]
            # Calculate center of character (moving backwards/CCW)
            char_mid_angle = current_angle - (char_w / radius) / 2
            
            x = cx + radius * math.cos(char_mid_angle)
            y = cy + radius * math.sin(char_mid_angle)
            
            # Rotation: Tangent facing inward (Upright at bottom)
            rotation_angle_deg = math.degrees(char_mid_angle) - 90
            
            img_main = create_rotated_char_image(char, font, text_color, rotation_angle_deg, char_w)
            paste_x = int(x - img_main.width / 2)
            paste_y = int(y - img_main.height / 2)
            image.paste(img_main, (paste_x, paste_y), img_main)

            current_angle -= ((char_w / radius) + kerning)

def draw_horizontal_text_centered(image, text, center_x, center_y, font, text_color):
    # This function worked well, but standardizing on the 3-pass caching approach is safer for consistency?
    # Actually, PIL draw.text supports offsets naturally for horizontal text, which explains why "PROOF OF THOUGHT" worked.
    # The user LIKED the result of this function in v20. I will keep it but ensure constants match (3px, 220/255).
    
    draw = ImageDraw.Draw(image)
    
    # Calculate total width
    total_w = 0
    char_widths = []
    for char in text:
        w = font.getlength(char)
        char_widths.append(w)
        total_w += w
        
    start_x = center_x - total_w / 2
    
    ascent, descent = font.getmetrics()
    baseline_y = center_y + (ascent - descent) / 2
    
    current_x = start_x
    
    for i, char in enumerate(text):
        w = char_widths[i]
        
        stroke_w = 0
        if char in ['-', ':']:
            stroke_w = 1

        draw.text((current_x, baseline_y), char, font=font, fill=text_color, anchor='ls', stroke_width=stroke_w, stroke_fill=text_color)
        current_x += w

def main():
    parser = argparse.ArgumentParser(description="Stamp dynamic text on the Proof of Thought Seal.")
    parser.add_argument("--date", type=str, help="Date string for top rim", default=None)
    parser.add_argument("--cert_id", type=str, help="Certificate ID", default=None)
    parser.add_argument("--registry_no", type=str, help="Registry Number", default=None)
    parser.add_argument("--hash", type=str, help="Document Hash", default=None)
    parser.add_argument("--verify", type=str, help="Verification URL", default=None)
    parser.add_argument("--holder", type=str, help="Holder Name", default=None)
    

    HERE = os.path.dirname(os.path.abspath(__file__))

    parser.add_argument(
        "--input",
        type=str,
        default=os.path.join(HERE, "templates", "proof_of_thought_timestamp_seal_template-2x.png"),
        help="Path to input template image (default: 2x template in repo)",
    )    
    parser.add_argument("--output", type=str, default="stamped_seal_final_HR.png", help="Path to output image")
    parser.add_argument("--font", type=str, default="/System/Library/Fonts/Supplemental/Arial Bold.ttf", help="Path to font file")
    parser.add_argument("--variant", type=str, choices=["MINTED","ENGRAVED"], default="MINTED")
    parser.add_argument("--bg", type=str, default="transparent", choices=["transparent", "white"],
                    help="Background mode for output PNG")

    args = parser.parse_args()
    
    date_text = args.date
    cert_id = args.cert_id
    registry_no = args.registry_no
    doc_hash = args.hash
    verify_url = args.verify
    holder_name = args.holder
    
    # Defaults
    if not date_text:
        now = datetime.utcnow()
        date_text = now.strftime("%Y.%m.%d • %H:%M:%S UTC")
    if not cert_id: cert_id = "PT-20260102-TESTID"
    if not registry_no: registry_no = "R-0000000000000001"
    if not doc_hash: doc_hash = "SHA-256: bb59a42a0...7b9fddbb5"
    if not verify_url: verify_url = "http://localhost:3333/verify/PT-20260102-F906EE"
    if not holder_name: holder_name = "Haggai Goldfarb"
    
    try:
        img = Image.open(args.input).convert("RGBA")
    except FileNotFoundError:
        print(f"Error: Could not find input image at {args.input}")
        sys.exit(1)
        
    try:
        try:
            # Fonts scaled for 2048x2048
            font_rim = ImageFont.truetype(args.font, 128) 
            font_id = ImageFont.truetype(args.font, 48)
            font_by = ImageFont.truetype(args.font, 24) 
            font_brand = ImageFont.truetype(args.font, 40)
            font_micro = ImageFont.truetype(args.font, 18) # Microtext Reduced
            font_reg = ImageFont.truetype(args.font, 28)
        except OSError:
            font_rim = ImageFont.truetype("arial.ttf", 128)
            font_id = ImageFont.truetype("arial.ttf", 48)
            font_by = ImageFont.truetype("arial.ttf", 24)
            font_brand = ImageFont.truetype("arial.ttf", 40)
            font_micro = ImageFont.truetype("arial.ttf", 18)
            font_reg = ImageFont.truetype("arial.ttf", 28)
    except Exception as e:
        font_rim = ImageFont.load_default()
        font_id = ImageFont.load_default()
        font_by = ImageFont.load_default()
        font_brand = ImageFont.load_default()
        font_micro = ImageFont.load_default()
        font_reg = ImageFont.load_default()

    CENTER = (1024, 1024) 
    RADIUS_TOP = 744 
    
    # Inner Rims: Reduced radius to fit "below circle of little lines"
    RADIUS_INNER_TOP = 510
    RADIUS_INNER_BOTTOM = 535 # Increased to push text lower (outwards)
    
    TEXT_COLOR = (110, 75, 45, 230) 
    MICRO_COLOR = (60, 60, 60, 240) # Dark Gray, Flat

    # Two Layers: One for Embossing, One for Flat Microtext
    embossed_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
    flat_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))

    # --- Embossed Elements ---
    # 1. Stamp Date on Top Rim
    if date_text:
        print(f"Stamping top: '{date_text}'")
        draw_text_on_arc(embossed_layer, date_text, CENTER, RADIUS_TOP, 'top', font_rim, TEXT_COLOR)
        
    # 2. Stamp Cert ID above center
    if cert_id:
        print(f"Stamping ID: '{cert_id}'")
        draw_horizontal_text_centered(embossed_layer, cert_id, 1024, 770, font_id, TEXT_COLOR)
    
    # 3. Stamp "by PROOF OF THOUGHT" 
    draw_horizontal_text_centered(embossed_layer, "by", 1024, 1200, font_by, TEXT_COLOR)
    draw_horizontal_text_centered(embossed_layer, "PROOF OF THOUGHT™", 1024, 1260, font_brand, TEXT_COLOR)

    # --- Flat Elements (Microtext) ---
    # 4. Registry No below "Proof of Thought"
    if registry_no:
        print(f"Stamping Registry: '{registry_no}'")
        draw_horizontal_text_centered(flat_layer, registry_no, 1024, 1330, font_reg, MICRO_COLOR)

    # 5. Hash (Inner Top Arc)
    if doc_hash:
        print(f"Stamping Hash: '{doc_hash[:20]}...'")
        draw_text_on_arc(flat_layer, doc_hash, CENTER, RADIUS_INNER_TOP, 'top', font_micro, MICRO_COLOR)

    # 6. Verify URL (Bottom Left Quadrant)
    if verify_url:
        print(f"Stamping URL: '{verify_url}'")
        # Start lower down (approx 150 degrees)
        start_ang = math.radians(150)
        draw_text_on_arc(flat_layer, verify_url, CENTER, RADIUS_INNER_BOTTOM, 'bottom', font_micro, MICRO_COLOR, manual_start_angle=start_ang)

    # 7. Holder Name (Bottom Right Quadrant)
    if holder_name:
        full_holder_text = f"holder: {holder_name}"
        print(f"Stamping Holder: '{full_holder_text}'")
        # Needs to end at approx 45 degrees (Lower down Right side)
        # Calculate width
        total_w_holder = 0
        for ch in full_holder_text:
             total_w_holder += font_micro.getlength(ch)
        
        # Angle Width
        holder_ang_width = total_w_holder / RADIUS_INNER_BOTTOM
        # Start Angle = End Angle (45 deg) + Width
        holder_start = math.radians(45) + holder_ang_width
        
        draw_text_on_arc(flat_layer, full_holder_text, CENTER, RADIUS_INNER_BOTTOM, 'bottom', font_micro, MICRO_COLOR, manual_start_angle=holder_start)

    # 8. apply Emboss to Embossed Layer Only
    base_with_emboss = create_global_emboss_layers(embossed_layer, img)
    
    # 9. Composite Flat Layer on top (No Emboss)
    base_with_emboss.alpha_composite(flat_layer)
    
    out = base_with_emboss

 

    # Always render on the 2x plate; only downscale for MINTED
    if args.variant == "MINTED":
        out = base_with_emboss.resize((1024, 1024), Image.LANCZOS)

    # ✅ APPLY BACKGROUND MODE
    if args.bg == "white":
        # Flatten onto a solid white background (no transparency)
        white = Image.new("RGBA", out.size, (255, 255, 255, 255))
        white.alpha_composite(out)
        out = white.convert("RGB")  # remove alpha for true white-background PNG

    out.save(args.output, "PNG")

    print(f"Saved to {args.output}")

if __name__ == "__main__":
    main()
