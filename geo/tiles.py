import math
from shapely.geometry import Polygon, box


def get_intersecting_tiles_with_packed_ids(polygon_coords, zoom):
    """
    Finds and prints all XYZ tiles that truly intersect a given polygon,
    along with their custom packed 64-bit unsigned integer representations.
    
    :param polygon_coords: List of [longitude, latitude] coordinates (closed ring)
    :param zoom: Target tile zoom level (integer)
    """
    # 1. Instantiate the spatial polygon object
    poly_geom = Polygon(polygon_coords)
    
    # 2. Extract bounding box extremes to locate calculation limits
    min_lng, min_lat, max_lng, max_lat = poly_geom.bounds
    
    # Helper math equations to convert coordinates back and forth
    def lon2tile(lon, z):
        return math.floor((lon + 180) / 360 * (2 ** z))

    def lat2tile(lat, z):
        lat_rad = math.radians(lat)
        return math.floor((1 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * (2 ** z))

    def tile2lon(x, z):
        return x / (2 ** z) * 360.0 - 180.0

    def tile2lat(y, z):
        n = math.pi - 2.0 * math.pi * y / (2 ** z)
        return 180.0 / math.pi * math.atan(0.5 * (math.exp(n) - math.exp(-n)))

    # Compute bounding grid tile limits
    x_min = lon2tile(min_lng, zoom)
    x_max = lon2tile(max_lng, zoom)
    y_min = lat2tile(max_lat, zoom)   # Higher lat gives smaller Y index row
    y_max = lat2tile(min_lat, zoom)   # Lower lat gives larger Y index row
    
    print(f"--- Processing Zoom {zoom} True Intersections ---")
    print(f"Bounding Box Sweep: X Range [{x_min} to {x_max}], Y Range [{y_min} to {y_max}]")
    print(f"{'Z':<4} | {'X':<9} | {'Y':<9} | {'Packed UINT64 ID':<20}")
    print("-" * 53)
    
    intersect_count = 0
    
    # 3. Intersect loop iteration sweep
    for x in range(x_min, x_max + 1):
        for y in range(y_min, y_max + 1):
            # Reverse-engineer bounding coordinate edges for this specific tile cell
            w = tile2lon(x, zoom)
            e = tile2lon(x + 1, zoom)
            n = tile2lat(y, zoom)
            s = tile2lat(y + 1, zoom)
            
            # Form a Shapely bounding geometry box for evaluation
            tile_box = box(w, s, e, n)
            
            # 4. Filter true spatial geometry intersections
            if poly_geom.intersects(tile_box):
                intersect_count += 1
                
                # --- Bit-Packing Formula ---
                # Z: bits 0-5 (mask with 63)
                # X: bits 6-34 (shifted left by 6)
                # Y: bits 35-63 (shifted left by 35)
                packed_id = (int(y) << 35) | (int(x) << 6) | int(zoom)
                
                print(f"{zoom:<4} | {x:<9} | {y:<9} | {packed_id:<20}")
                
    print("-" * 53)
    print(f"Calculation Complete. Found {intersect_count} true intersecting tiles.\n")



def get_tile_for_point(lat, lon, zoom):
    """
    Finds the single XYZ tile containing a point and returns its packed ID.
    """
    # Convert Longitude to tile column X
    x = math.floor((lon + 180) / 360 * (2 ** zoom))
    
    # Convert Latitude to tile row Y
    lat_rad = math.radians(lat)
    y = math.floor((1 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * (2 ** zoom))
    
    # Bit-pack into a 64-bit integer (Z: bits 0-5, X: bits 6-34, Y: bits 35-63)
    packed_id = (int(y) << 35) | (int(x) << 6) | int(zoom)
    
    print(f"--- Point Tile Match at Zoom {zoom} ---")
    print(f"Coordinates : Lat {lat}, Lon {lon}")
    print(f"Tile Path   : /{zoom}/{x}/{y}.png")
    print(f"Packed ID   : {packed_id}")
    
    return {"z": zoom, "x": x, "y": y, "packed_id": packed_id}


# ==========================================
# Example Usage Execution Block
# ==========================================
if __name__ == "__main__":
    # Your compact Patna sample polygon array layout
    patna_polygon = [
        [85.074348, 25.601574],
        [85.097866, 25.618614],
        [85.126705, 25.607926],
        [85.124474, 25.587941],
        [85.100098, 25.582208],
        [85.081387, 25.574151],
        [85.074348, 25.601574] # Loop structural termination coordinate closure
    ]
    
    # Evaluate at map zoom resolution 13
    # get_intersecting_tiles_with_packed_ids(patna_polygon, zoom=16)
    # Example: A point inside your Patna polygon at Zoom 13
    get_tile_for_point(lat=25.601574, lon=85.074348, zoom=13)