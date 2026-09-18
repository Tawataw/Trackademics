cat src/store/useTrackerStore.ts | grep -v "name: 'hsc-tracker-storage'," > temp.ts
echo "    {" >> temp.ts
echo "      name: 'hsc-tracker-storage'," >> temp.ts
echo "      storage: createJSONStorage(() => {" >> temp.ts
echo "        let timeout: any;" >> temp.ts
echo "        return {" >> temp.ts
echo "          getItem: async (name) => {" >> temp.ts
echo "            try {" >> temp.ts
echo "              const state = await dbApi.getCalculatorState();" >> temp.ts
echo "              if (state) return JSON.stringify({ state, version: 0 });" >> temp.ts
echo "            } catch (e) {}" >> temp.ts
echo "            return localStorage.getItem(name);" >> temp.ts
echo "          }," >> temp.ts
echo "          setItem: (name, value) => {" >> temp.ts
echo "            localStorage.setItem(name, value);" >> temp.ts
echo "            clearTimeout(timeout);" >> temp.ts
echo "            timeout = setTimeout(() => {" >> temp.ts
echo "              try {" >> temp.ts
echo "                const parsed = JSON.parse(value);" >> temp.ts
echo "                dbApi.saveCalculatorState(parsed.state);" >> temp.ts
echo "              } catch (e) {}" >> temp.ts
echo "            }, 2000);" >> temp.ts
echo "          }," >> temp.ts
echo "          removeItem: (name) => localStorage.removeItem(name)" >> temp.ts
echo "        };" >> temp.ts
echo "      })" >> temp.ts
echo "    }" >> temp.ts
echo "  )" >> temp.ts
echo ");" >> temp.ts
sed -i "s/import { persist } from 'zustand\/middleware';/import { persist, createJSONStorage } from 'zustand\/middleware';/" temp.ts
mv temp.ts src/store/useTrackerStore.ts
