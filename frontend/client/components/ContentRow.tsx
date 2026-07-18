import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

type Props = {
  title: string;
  items: any[];
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function ContentRow({ title, items }: Props) {
  return (
    <section className="px-6 py-4">
      <h2 className="text-white text-xl font-bold mb-4">{title}</h2>

      <motion.div 
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-50px" }}
      >
        {items?.map((item: any, index: number) => {
          // Generate a simple slug for the video URL based on title if no ID is present
          const videoId = item.courseId || item.id || item.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'demo';
          
          return (
            <motion.div key={index} variants={itemAnim} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link 
                to={`/course-player/${videoId}`}
                className="group bg-zinc-800/80 backdrop-blur-sm rounded-xl border border-zinc-700/50 text-white hover:bg-zinc-700/80 hover:border-primary/50 transition-all block cursor-pointer shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary h-full flex flex-col overflow-hidden"
              >
                {item.image ? (
                  <div className="h-32 w-full overflow-hidden relative">
                    <img 
                      src={item.image} 
                      alt={item.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-80" />
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                )}
                <div className="p-4 flex-1 flex flex-col justify-end min-h-[80px]">
                  <h3 className="font-semibold text-sm md:text-base line-clamp-2">{item.title || "Course"}</h3>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
