import json

data_folder = 'output'
## Get this from a config file
# f = open("%s/config.json" %(data_folder), 'r')
# cities = json.loads(f.read())
# f.close()

cities = {
    'ny' : {
        'name' : 'New York',
        'coordinates' : {
            'lat' : 0,
            'long' : 0
        }
    }, 
    'oakland' : {
        'name' : 'Oakland',
        'coordinates' : {
            'lat' : 10,
            'long' : 10
        }
    }, 
    'sf' : {
        'name' : 'San Francisco',
        'coordinates' : {
            'lat' : 30,
            'long' : 30
        }
    },
}

for city in cities.keys():
    for data in ['genres', 'venues']:
        f = open("%s/%s/%s.json" %(data_folder, city, data), 'r')
        cities[city].update({
            data : json.loads(f.read())
        })
        f.close()
f = file("data.json", 'w')
f.write(json.dumps(cities))
f.close()
