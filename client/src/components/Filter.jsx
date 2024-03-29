const categories = [
  { name: "Electronics", value: "electronics" },
  { name: "Home", value: "home" },
  { name: "Fashion", value: "fashion" },
  { name: "Sports", value: "sports" },
  { name: "Books", value: "books" },
];

const ages = [
  { name: "0-2 Years old", value: "0-2" },
  { name: "3-5 Years old", value: "3-5" },
  { name: "6-8 Years old", value: "6-8" },
  { name: "9-12 Years old", value: "9-12" },
  { name: "13+ Years old", value: "12-20" },
];

const Filter = ({ showFilters, setShowFilters, filters, setFilters }) => {
  return (
    <div className="w-full flex flex-col transition duration-300">
      <div className="flex justify-between">
        <h1 className=" text-xl text-orange-700">Filters</h1>
        <i
          onClick={() => setShowFilters(!showFilters)}
          className="ri-close-line text-3xl hover:scale-125 transition duration-200 ease-in-out cursor-pointer"
        ></i>
      </div>
      <div className="flex flex-col">
        <h1 className="text-gray-600 mb-4">Categories</h1>
        <div className="flex flex-col  gap-1">
          {categories.map((category, index) => (
            <div key={index} className="flex">
              <input
                className="flex-1 "
                type="checkbox"
                name="category"
                checked={filters?.category.includes(category.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters({
                      ...filters,
                      category: [...filters.category, category.value],
                    });
                  } else {
                    setFilters({
                      ...filters,
                      category: filters.category.filter(
                        (item) => item !== category.value
                      ),
                    });
                  }
                }}
              />
              <label htmlFor="category" className="flex-1">
                {" "}
                {category.name}{" "}
              </label>
            </div>
          ))}
        </div>
        <h1 className="text-gray-600 my-4">Ages</h1>
        <div className="flex flex-col gap-1">
          {ages.map((age, index) => (
            <div key={index} className="flex">
              <input
                className="flex-1"
                type="checkbox"
                name="age"
                checked={filters?.age.includes(age.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFilters({
                      ...filters,
                      age: [...filters.age, age.value],
                    });
                  } else {
                    setFilters({
                      ...filters,
                      age: filters.age.filter((item) => item !== age.value),
                    });
                  }
                }}
              />
              <label htmlFor="category" className="flex-1">
                {age.name}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filter;
