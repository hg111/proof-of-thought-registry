import re

def format_patent(input_file, output_file):
    with open(input_file, 'r') as f:
        lines = f.readlines()

    formatted_lines = []
    paragraph_counter = 1
    in_claims = False
    in_abstract = False

    # Regex to identify headers (Markdown style)
    header_pattern = re.compile(r'^#+\s+(.*)')

    for line in lines:
        stripped_line = line.strip()

        # Check for Claims or Abstract sections to stop/change numbering logic
        # Only trigger CLAIMS if it is a header line or specifically "CLAIMS"
        if stripped_line.upper() == "CLAIMS" or (header_match and "CLAIMS" in stripped_line.upper()):
             in_claims = True
        if "ABSTRACT OF THE DISCLOSURE" in stripped_line.upper():
             in_abstract = True 

        # Preserve empty lines
        if not stripped_line:
            formatted_lines.append("\n")
            continue

        # Handle Headers
        header_match = header_pattern.match(line)
        if header_match:
            # Keep header text, strip markdown '#'
            header_text = header_match.group(1).upper()
            formatted_lines.append(f"{header_text}\n")
            continue

        # Handle Content
        if in_claims or in_abstract:
            # Do not add [xxxx] to claims or abstract
            formatted_lines.append(line)
        else:
            # Add [xxxx] to specification paragraphs
            paragraph_id = f"[{paragraph_counter:04d}]"
            formatted_lines.append(f"{paragraph_id} {line}")
            paragraph_counter += 1

    with open(output_file, 'w') as f:
        f.writelines(formatted_lines)
    
    print(f"Successfully formatted patent application to {output_file}")
    print(f"Total numbered paragraphs: {paragraph_counter - 1}")

if __name__ == "__main__":
    input_path = "/Users/haggai/proofofthought/proofofthought_mvp/IP/Non_Provisional_Application.md"
    output_path = "/Users/haggai/proofofthought/proofofthought_mvp/IP/Non_Provisional_Application_Filed_Ready.txt"
    format_patent(input_path, output_path)
